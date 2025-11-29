import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import {OpenAIEmbeddings} from "@langchain/openai";
// import type { Document } from "@langchain/core/documents";
import pkg from "pg";
const { Pool } = pkg;

type PoolConfig = ConstructorParameters<typeof Pool>[0];

import {
  PGVectorStore,
  DistanceStrategy,
} from "@langchain/community/vectorstores/pgvector";


// const embeddings = new GoogleGenerativeAIEmbeddings({
//   model: "embedding-001",
//   apiKey: "AIzaSyCfv7U-c4UyHxSp_Iyb2BEyzBOfl316p4E"});


const openaiEmbeddoings = new OpenAIEmbeddings({
  modelName: "Qwen/Qwen3-Embedding-8B",
  openAIApiKey: "v1.CmMKHHN0YXRpY2tleS1lMDBnNzM2aGF3aDl5bm1qZWgSIXNlcnZpY2VhY2NvdW50LWUwMHBoZzVjNXlodng0bm1lYzILCLu_qskGENXigRQ6DAi6wsKUBxDA5t_IAUACWgNlMDA.AAAAAAAAAAEcTjg5Ex5ocC2v4OfwUCECd0PQ2cgLP7AggentXOo3p_hTZw0sGOEQoox4Ldbq4A3DE1wDzAOi0OLeLoGEqcAK",
  configuration: { baseURL: "https://api.tokenfactory.nebius.com/v1/" },
});
const config = {
  postgresConnectionOptions: {
    type: "postgres",
    host: "db.rslmmqnxewsgowmixukl.supabase.co",
    port: 6543,
    user: "postgres",
    password: "Rag1234!",
    database: "postgres",
  } as PoolConfig,
  tableName: "testlangchainjs",
  columns: {
    idColumnName: "id",
    vectorColumnName: "vector",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
  distanceStrategy: "cosine" as DistanceStrategy,
};

async function initializeVectorStore() {
  const vectorStore = await PGVectorStore.initialize(
    openaiEmbeddoings,
    config,
    );
  return vectorStore;
}
async function processPdf(path: string): Promise<boolean> {
  const loader = new PDFLoader(path);
  const docs = await loader.load();
  console.log("Loaded documents:", docs);


  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const documents = await splitter.splitDocuments(docs);
  console.log("Split into documents:", documents);
  const vectorStore = await initializeVectorStore();
  console.log("Initialized vector store.");
  await vectorStore.addDocuments(
    documents
  );
  console.log("Documents added to vector store:", documents.length);
  return true;
}

processPdf("app.pdf").then((success) => {
  console.log("Processing successful:", success);
}).catch((error) => {
  console.error("Error processing PDF:", error);
});

