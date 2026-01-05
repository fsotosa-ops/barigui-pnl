import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ADVISOR_SYSTEM_PROMPT } from '@/lib/prompts';
import { generateEmbedding } from '@/lib/ai/embeddings'; // Tu nueva función

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const cookieStore = await cookies();
    
    // 1. Cliente Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();

    // 2. OBTENCIÓN DE DATOS HÍBRIDA

    // A) SQL DURO (Para números exactos) - KPI Dashboard
    const { data: profile } = await supabase.from('profiles').select('*').single();
    const { data: recentTx } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(5);

    // B) VECTORES (Para memoria y contexto semántico) - "Recuerdos"
    // Convertimos la pregunta del usuario en vector
    const queryEmbedding = await generateEmbedding(message);
    
    // Buscamos en la memoria (llamada RPC a la función SQL que creamos)
    const { data: similarMemories } = await supabase.rpc('match_financial_memory', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7, // Similitud mínima del 70%
      match_count: 5,
      p_user_id: user?.id
    });

    // 3. Construir Contexto
    const context = {
      hard_numbers: {
        runway: profile?.current_cash ? (profile.current_cash / (profile.annual_budget/12)).toFixed(1) : 0,
        cash: profile?.current_cash
      },
      recent_activity: recentTx,
      relevant_history: similarMemories?.map((m: any) => m.content) // Aquí inyectamos lo que "recordó"
    };

    // 4. Llamada a LLM
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: ADVISOR_SYSTEM_PROMPT },
        { 
          role: "user", 
          content: `Contexto Híbrido (Datos + Memoria):\n${JSON.stringify(context, null, 2)}\n\nPregunta: ${message}` 
        },
      ],
    });

    return NextResponse.json({ reply: response.choices[0].message.content });

  } catch (error) {
    return NextResponse.json({ error: "Error en el cerebro híbrido" }, { status: 500 });
  }
}