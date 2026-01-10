import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { description, amount, originalAmount, category, date, type, currency, scope } = body;
    
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

    const { data: tx, error } = await supabase
      .from('transactions')
      .upsert([{
        user_id: user.id,
        description,
        amount_usd: safeAmount,
        original_currency: currency,
        category,
        date,
        type,
        scope: scope || 'personal', // Default a personal si falla la IA
        original_amount: safeOrig,
        exchange_rate: rate
      }], { 
        onConflict: 'user_id, date, description, original_amount, type', 
        ignoreDuplicates: true 
      })
      .select().maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, transaction: tx, duplicate: !tx });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}