import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, description, amount, originalAmount, category, date, type, currency, scope } = body;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const safeAmount = amount || 0;
    const safeOrig = originalAmount || safeAmount;
    const rate = safeOrig !== 0 ? (safeAmount / safeOrig) : 1;

    // Actualizamos buscando específicamente por ID y User ID (seguridad)
    const { data: tx, error } = await supabase
      .from('transactions')
      .update({
        description,
        amount_usd: safeAmount,
        original_currency: currency,
        category,
        date,
        type,
        scope,
        original_amount: safeOrig,
        exchange_rate: rate
      })
      .eq('id', id)
      .eq('user_id', user.id) // Asegura que solo edites tus propias transacciones
      .select()
      .single();

    if (error) {
      console.error("Update Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, transaction: tx });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}