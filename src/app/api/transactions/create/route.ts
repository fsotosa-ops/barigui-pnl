import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    const safeOriginalAmount = originalAmount !== undefined ? originalAmount : amount;
    const calculatedRate = safeOriginalAmount !== 0 ? Number((amount / safeOriginalAmount).toFixed(6)) : 1;

    // Usamos Upsert con ignoreDuplicates para que la DB decida si es nuevo o no
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
      .maybeSingle();

    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

    if (!tx) {
        // Si tx es null es porque la DB detectó el duplicado y no insertó nada
        return NextResponse.json({ success: true, duplicate: true });
    }

    return NextResponse.json({ success: true, transaction: tx });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}