import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const EMBEDDING_MODEL =
  process.env.GROQ_EMBEDDING_MODEL || "nomic-embed-text-v1_5";

export type ChunkCreateInput = {
  content: string;
  chunkIndex: number;
  embedding: string | null;
  embeddingModel: string | null;
};

export function serializeEmbedding(embedding: number[]) {
  return JSON.stringify(embedding);
}

export function parseEmbedding(embedding: string | null) {
  if (!embedding) {
    return null;
  }

  try {
    const parsed = JSON.parse(embedding);
    return Array.isArray(parsed) && parsed.every((value) => typeof value === "number")
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (let index = 0; index < a.length; index += 1) {
    const aValue = a[index];
    const bValue = b[index];

    dotProduct += aValue * bValue;
    aMagnitude += aValue * aValue;
    bMagnitude += bValue * bValue;
  }

  if (aMagnitude === 0 || bMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
}

export async function createEmbeddings(input: string[]) {
  if (input.length === 0) {
    return [];
  }

  const response = await groq.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
    encoding_format: "float",
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map((item) => {
      if (typeof item.embedding === "string") {
        throw new Error("Expected float embeddings but received base64 embeddings");
      }

      return item.embedding;
    });
}

export async function createChunkInputs(chunks: string[]): Promise<ChunkCreateInput[]> {
  try {
    const embeddings = await createEmbeddings(chunks);

    return chunks.map((chunk, index) => ({
      content: chunk,
      chunkIndex: index,
      embedding: embeddings[index] ? serializeEmbedding(embeddings[index]) : null,
      embeddingModel: embeddings[index] ? EMBEDDING_MODEL : null,
    }));
  } catch (error) {
    console.error("Embedding generation failed:", error);

    return chunks.map((chunk, index) => ({
      content: chunk,
      chunkIndex: index,
      embedding: null,
      embeddingModel: null,
    }));
  }
}
