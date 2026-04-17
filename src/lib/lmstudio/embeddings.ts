import { getLmStudioClient, checkLmStudioHealth } from "./client";
import { getIntegrationConfig } from "@/lib/integrations/config";

export class LmStudioUnavailableError extends Error {
  constructor() {
    super("Local LLM is not available");
    this.name = "LmStudioUnavailableError";
  }
}

function getEmbeddingModel(): string {
  try {
    const dbModel = getIntegrationConfig("local_llm", "embedding_model");
    if (dbModel && dbModel.trim()) return dbModel.trim();
  } catch {}
  const env = (process.env.LMSTUDIO_EMBEDDING_MODEL || "").trim();
  return env || "nomic-ai/nomic-embed-text-v2-moe";
}

const MAX_BATCH_SIZE = 32;

export async function embed(text: string): Promise<number[]> {
  const available = await checkLmStudioHealth();
  if (!available) throw new LmStudioUnavailableError();

  const client = getLmStudioClient();
  const response = await client.embeddings.create({
    model: getEmbeddingModel(),
    input: text,
  });

  const vec = response.data[0].embedding;
  if (vec.length !== 768) {
    console.warn(`[embeddings] Unexpected dimension ${vec.length} from model ${getEmbeddingModel()} (expected 768)`);
  }
  return vec;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const available = await checkLmStudioHealth();
  if (!available) throw new LmStudioUnavailableError();

  const client = getLmStudioClient();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    const response = await client.embeddings.create({
      model: getEmbeddingModel(),
      input: batch,
    });
    for (const item of response.data) {
      results.push(item.embedding);
    }
  }

  return results;
}
