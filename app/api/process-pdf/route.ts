import { NextResponse } from 'next/server';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import type { Document } from '@langchain/core/documents';

process.env.NODE_OPTIONS = "--dns-result-order=ipv4first";

async function loadPdf(file: File): Promise<Document[]> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const blob = new Blob([uint8Array], { type: 'application/pdf' });
  const loader = new PDFLoader(blob, { splitPages: false });
  return await loader.load();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const docs = await loadPdf(file);
    const text = docs.map(d => d.pageContent).join(' ').replace(/\s+/g, ' ').trim();

    if (text.length < 50) {
      return NextResponse.json({ error: 'No text found in PDF' }, { status: 400 });
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });
    const chunks = await splitter.splitText(text);

    const documents = chunks.map((chunk, i) => ({
      pageContent: chunk,
      metadata: {
        source: file.name,
        chunk_index: i,
        document_id: crypto.randomUUID(),
      },
    } satisfies Document));

    // FREE Hugging Face embeddings
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_INFERENCE_API_KEY!,
      model: "sentence-transformers/all-MiniLM-L6-v2",
    });

    // PGVectorStore config (Supabase)
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

    // Initialize + Add documents (does embedding + insert automatically)
    const vectorStore = await PGVectorStore.initialize(embeddings, config);
    await vectorStore.addDocuments(documents);
    await vectorStore.end();

    return NextResponse.json({
      success: true,
      message: "PDF processed with PGVectorStore + Hugging Face (FREE)",
      chunksStored: documents.length,
      model: "all-MiniLM-L6-v2",
      dimension: 384,
      tip: "You can now use vectorStore.similaritySearch() in your chat route!",
    });

  } catch (error) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
