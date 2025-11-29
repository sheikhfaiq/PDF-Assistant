import { NextResponse } from 'next/server';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";


const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_INFERENCE_API_KEY!,
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
  temperature: 0.7,
  maxOutputTokens: 1024,
  streaming: false,
});

const config = {
  postgresConnectionOptions: {
    connectionString: process.env.SUPABASE_DATABASE_URL!,
  },
  tableName: "document_chunks",
  columns: {
    idColumnName: "id",
    vectorColumnName: "embedding",
    contentColumnName: "chunk_text",
    metadataColumnName: "metadata",
  },
};

interface ChatRequest {
  question: string;
  history: Array<{ role: "user" | "assistant"; content: string; sources?: string[] }>;
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { question, history = [] } = body;

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    // Retrieve context
    const vectorStore = await PGVectorStore.initialize(embeddings, config);
    const retriever = vectorStore.asRetriever({ k: 8 });
    const docs = await retriever.invoke(question);
    await vectorStore.end();

    const context = docs.map(d => d.pageContent).join("\n\n");
    const sources = [...new Set(docs.map(d => d.metadata.source as string))];


    const messages = [
      new SystemMessage(`
You are a friendly, expert assistant answering questions based ONLY on the uploaded PDFs.
Use the context below. Be natural, concise, and helpful.
If unsure, say "I don't have that information."

CONTEXT:
${context}
      `),

      ...history.map(msg =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
      new HumanMessage(question),
    ];

    const response = await llm.invoke(messages);
    const answerText = typeof response.content === "string" ? response.content : "No response";

    return NextResponse.json({
      answer: answerText,
      sources
    });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
