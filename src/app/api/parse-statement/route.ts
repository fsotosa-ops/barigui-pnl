import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';
import { STATEMENT_ANALYSIS_PROMPT } from '@/lib/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let userContent: any[] = [];
    let fileType = "desconocido";

    // 1. IMÁGENES
    if (file.type.startsWith('image/')) {
      const base64File = buffer.toString('base64');
      userContent = [
        { type: "text", text: "Analiza esta IMAGEN de una cartola bancaria. Extrae cada transacción en formato JSON." },
        {
          type: "image_url",
          image_url: { url: `data:${file.type};base64,${base64File}` },
        },
      ];
      fileType = "imagen";
    } 
    
    // 2. EXCEL
    else if (
      file.type.includes('sheet') || 
      file.type.includes('excel') ||
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls')
    ) {
      try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; 
        const sheet = workbook.Sheets[sheetName];
        const csvContent = XLSX.utils.sheet_to_csv(sheet);
        
        userContent = [
           { type: "text", text: "Analiza este CSV/Excel bancario y responde en JSON:" },
           { type: "text", text: csvContent }
        ];
        fileType = "excel";
      } catch (e) {
        return NextResponse.json({ error: "Error leyendo Excel" }, { status: 500 });
      }
    }

    // 3. CSV
    else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const textContent = new TextDecoder("utf-8").decode(buffer);
      userContent = [
         { type: "text", text: "Analiza este CSV bancario y responde en JSON:" },
         { type: "text", text: textContent }
      ];
      fileType = "csv";
    } 
    
    else {
       return NextResponse.json({ error: "Formato no soportado (PDF temporalmente desactivado)." }, { status: 400 });
    }

    console.log(`📂 Procesando: ${fileType}`);

    // CORRECCIÓN PRINCIPAL: Concatenamos una instrucción explícita de JSON
    // Esto evita el error 400 de OpenAI
    const systemMessage = `${STATEMENT_ANALYSIS_PROMPT}\n\nIMPORTANTE: Tu respuesta DEBE ser un objeto JSON válido.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userContent as any },
      ],
      response_format: { type: "json_object" },
      temperature: 0, 
    });

    const content = response.choices[0].message.content;
    
    // Limpieza de Markdown antes del parseo (por si GPT devuelve ```json ... ```)
    const cleanContent = content?.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedResult;
    try {
        parsedResult = JSON.parse(cleanContent || '{}');
    } catch (e) {
        console.error("JSON Parse Error:", content);
        return NextResponse.json({ error: "La IA generó una respuesta inválida." }, { status: 500 });
    }

    return NextResponse.json({ transactions: parsedResult.transactions || [] });

  } catch (error: any) {
    console.error("Error API:", error);
    // Mostrar el mensaje real de OpenAI si falla
    const errorMessage = error.error?.message || error.message || "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}