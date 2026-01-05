import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateEmbedding } from '@/lib/ai/embeddings';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { description, amount, category, date, type, currency } = body;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Guardar la Transacción (Dato Duro SQL)
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        description,
        amount_usd: amount, // Asumiendo que ya viene convertido o es la base
        original_currency: currency,
        category,
        date,
        type
      }])
      .select()
      .single();

    if (txError) throw txError;

    // 2. Generar el "Recuerdo" (Vector)
    // Creamos un texto rico semánticamente para el agente
    const memoryText = `Gasto de ${amount} ${currency} en ${category}: ${description}. Fecha: ${date}`;
    const vector = await generateEmbedding(memoryText);

    // 3. Guardar en Memoria Vectorial
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

    if (memError) console.error("Error guardando memoria:", memError);

    return NextResponse.json({ success: true, transaction: tx });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}