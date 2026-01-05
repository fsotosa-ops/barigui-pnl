import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateEmbedding } from '@/lib/ai/embeddings';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Extraemos todos los datos necesarios
    const { description, amount, originalAmount, category, date, type, currency } = body;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Lógica de seguridad para montos y tasas
    // Si originalAmount no viene, asumimos que es igual a amount (tasa 1:1)
    const safeOriginalAmount = originalAmount !== undefined && originalAmount !== null ? originalAmount : amount;
    
    // Calculamos el exchange_rate para cumplir con el NOT NULL de la DB
    // Evitamos división por cero
    const calculatedRate = safeOriginalAmount !== 0 
        ? Number((amount / safeOriginalAmount).toFixed(6)) 
        : 1;

    // 3. Guardar o Ignorar Duplicados (Upsert)
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
          original_amount: safeOriginalAmount, // Soluciona error original_amount
          exchange_rate: calculatedRate        // Soluciona error exchange_rate
        }],
        { 
          // Clave única compuesta para evitar duplicados
          onConflict: 'user_id, date, description, original_amount, type', 
          ignoreDuplicates: true 
        }
      )
      .select()
      .single();

    if (txError) {
        console.error("Error SQL al guardar:", txError);
        throw txError;
    }

    // Si tx es null, es porque era duplicado y se ignoró. Retornamos éxito.
    if (!tx) {
        return NextResponse.json({ success: true, duplicate: true });
    }

    // 4. Generar "Recuerdo" (Vector) - Bloque Try/Catch para no fallar si OpenAI falla
    try {
        const memoryText = `Gasto de ${safeOriginalAmount} ${currency} en ${category}: ${description}. Fecha: ${date}`;
        const vector = await generateEmbedding(memoryText);

        const { error: memError } = await supabase
        .from('financial_memory')
        .insert({
            user_id: user.id,
            content: memoryText,
            metadata: { 
                type: 'transaction', 
                category, 
                transaction_id: tx.id 
            },
            embedding: vector
        });

        if (memError) console.error("Error guardando memoria (no crítico):", memError);
    } catch (e) {
        console.error("Error generando embedding (no crítico):", e);
    }

    return NextResponse.json({ success: true, transaction: tx });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}