import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text: string) {
  // Limpiamos el texto para ahorrar tokens y ruido
  const cleanText = text.replace(/\n/g, ' ');
  
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small', // Más barato y eficiente que ada-002
    input: cleanText,
  });

  return embeddingResponse.data[0].embedding;
}