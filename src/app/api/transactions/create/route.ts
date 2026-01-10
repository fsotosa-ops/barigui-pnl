import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      description, 
      amount = 0, 
      originalAmount = 0, 
      category, 
      date, 
      type, 
      currency = 'CLP', 
      scope = 'personal' 
    } = body;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const safeOriginal = originalAmount || amount;
    const rate = safeOriginal !== 0 ? (amount / safeOriginal) : 1;

    // CORRECCIÓN CLAVE: El conflicto debe coincidir EXACTAMENTE con el índice UNIQUE de la DB
    const { data: tx, error } = await supabase
      .from('transactions')
      .upsert([{
        user_id: user.id,
        description,
        amount_usd: amount,
        original_currency: currency,
        category,
        date,
        type,
        scope, // Esto antes faltaba en la unicidad
        original_amount: safeOriginal,
        exchange_rate: rate
      }], { 
        // IMPORTANTE: Asegúrate de que en Supabase hayas ejecutado:
        // ALTER TABLE transactions DROP CONSTRAINT unique_transaction_entry;
        // ALTER TABLE transactions ADD CONSTRAINT unique_transaction_entry UNIQUE (user_id, date, description, original_amount, type, scope);
        onConflict: 'user_id, date, description, original_amount, type, scope', 
        ignoreDuplicates: true 
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("DB Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, transaction: tx, duplicate: !tx });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}