import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateEmbedding } from '@/lib/ai/embeddings';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { description, amount, originalAmount, category, date, type, currency } = body;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const safeOriginalAmount = originalAmount !== undefined && originalAmount !== null ? originalAmount : amount;
    const calculatedRate = safeOriginalAmount !== 0 ? Number((amount / safeOriginalAmount).toFixed(6)) : 1;

    // 1. Upsert con maybeSingle()
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .upsert(
        [{
          user_id: user.id,
          description,
          amount_usd: amount,
          original_currency: currency,
          category,
          date,
          type,
          original_amount: safeOriginalAmount,
          exchange_rate: calculatedRate
        }],
        { 
          onConflict: 'user_id, date, description, original_amount, type', 
          ignoreDuplicates: true 
        }
      )
      .select()
      .maybeSingle(); // <--- CAMBIO CLAVE AQUÍ

    if (txError) {
        // Ignoramos errores de duplicado si la DB lanza PGRST116 de otra forma, 
        // pero con maybeSingle no debería llegar aquí por duplicados.
        console.error("Error SQL:", txError);
        return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    // 2. Detección de Duplicado
    if (!tx) {
        // Si tx es null, es porque upsert ignoró la inserción (ya existía).
        return NextResponse.json({ success: true, duplicate: true });
    }

    // 3. Generar Memoria (Solo si es nuevo)
    try {
        const memoryText = `Gasto de ${safeOriginalAmount} ${currency} en ${category}: ${description}. Fecha: ${date}`;
        const vector = await generateEmbedding(memoryText);

        await supabase.from('financial_memory').insert({
            user_id: user.id,
            content: memoryText,
            metadata: { type: 'transaction', category, transaction_id: tx.id },
            embedding: vector
        });
    } catch (e) {
        console.error("Error embedding:", e);
    }

    return NextResponse.json({ success: true, transaction: tx });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}