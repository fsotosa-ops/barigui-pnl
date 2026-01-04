import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';
import { STATEMENT_ANALYSIS_PROMPT } from '@/lib/prompts'; // <--- USAMOS TU MODULO

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
        { type: "text", text: "Analiza esta IMAGEN de una cartola bancaria. Extrae cada transacción." },
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
           { type: "text", text: "Analiza este CSV/Excel bancario:" },
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
         { type: "text", text: "Analiza este CSV bancario:" },
         { type: "text", text: textContent }
      ];
      fileType = "csv";
    } 
    
    else {
       // Mensaje claro de que PDF no está soportado por ahora
       return NextResponse.json({ error: "Formato no soportado. Por favor usa Imágenes, Excel o CSV (PDF desactivado temporalmente)." }, { status: 400 });
    }

    console.log(`📂 Procesando: ${fileType}`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: STATEMENT_ANALYSIS_PROMPT }, // <--- PROMPT MODULARIZADO
        { role: "user", content: userContent as any },
      ],
      response_format: { type: "json_object" },
      temperature: 0, 
    });

    const content = response.choices[0].message.content;
    const parsedResult = JSON.parse(content || '{}');

    return NextResponse.json({ transactions: parsedResult.transactions || [] });

  } catch (error) {
    console.error("Error API:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}