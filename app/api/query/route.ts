import { NextResponse } from 'next/server';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_INFERENCE_API_KEY!,
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
});

const config = {
  postgresConnectionOptions: { connectionString: process.env.SUPABASE_DATABASE_URL! },
  tableName: "document_chunks",
  columns: {
    idColumnName: "id",
    vectorColumnName: "embedding",
    contentColumnName: "chunk_text",
    metadataColumnName: "metadata",
  },
};

export async function POST(request: Request) {
  try {
    const { question } = await request.json();
    if (!question) return NextResponse.json({ error: "No question" }, { status: 400 });

    const vectorStore = await PGVectorStore.initialize(embeddings, config);
    const retriever = vectorStore.asRetriever({ k: 6 });
    const docs = await retriever.invoke(question);
    await vectorStore.end();

    const context = docs.map(d => d.pageContent).join("\n\n");
    const sources = [...new Set(docs.map(d => d.metadata.source as string))];

    const prompt = `Answer based ONLY on this context:\n\n${context}\n\nQuestion: ${question}`;

    const answer = await llm.invoke(prompt);

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to answer" }, { status: 500 });
  }
}
