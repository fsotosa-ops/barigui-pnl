import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Necesitas tu API KEY en el archivo .env.local
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

    // Convertir archivo a Base64 para enviarlo a GPT-4o Vision/File
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = buffer.toString('base64');

    // El Prompt Maestro
    const prompt = `
      Actúa como un analista de datos financieros. 
      Analiza esta imagen/PDF de una cartola bancaria.
      Extrae CADA transacción y devuélvela en un formato JSON estricto.
      
      Reglas de Categorización:
      - Si dice "Sumadots", categoría: "Ingresos Operativos".
      - Si es supermercado, categoría: "Supermercado".
      - Si es Uber/Transporte, categoría: "Movilidad".
      - Si no sabes, categoría: "Otros".

      Output esperado (JSON Array):
      [
        { "date": "YYYY-MM-DD", "description": "Texto exacto", "amount": 100.00, "type": "expense/income", "currency": "detectada", "category": "según reglas" }
      ]
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Modelo multimodal capaz de leer imágenes/documentos
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64File}`, // Asumiendo imagen por ahora
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    const transactions = JSON.parse(content || '{}');

    return NextResponse.json({ transactions });

  } catch (error) {
    console.error("Error parsing statement:", error);
    return NextResponse.json({ error: "Error processing file" }, { status: 500 });
  }
}