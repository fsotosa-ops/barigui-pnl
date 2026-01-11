import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      description, amount = 0, originalAmount = 0, category, 
      date, type, currency = 'CLP', scope = 'personal',
      importBatchId // <--- NUEVO
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
        scope,
        original_amount: safeOriginal,
        exchange_rate: rate,
        import_batch_id: importBatchId, // <--- Guardamos la referencia
        deleted_at: null 
      }], { 
        onConflict: 'user_id, date, description, original_amount, type, scope', 
        ignoreDuplicates: false
      })
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, transaction: tx });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}