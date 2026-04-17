import { getLmStudioClient, checkLmStudioHealth } from "./client";
import { LmStudioUnavailableError } from "./embeddings";
import { getIntegrationConfig } from "@/lib/integrations/config";

function getChatModel(): string {
  try {
    const dbModel = getIntegrationConfig("local_llm", "chat_model");
    if (dbModel && dbModel.trim()) return dbModel.trim();
  } catch {}
  const env = (process.env.LMSTUDIO_CHAT_MODEL || "").trim();
  return env || "qwen3.5-9b";
}

export type LocalCompleteOptions = {
  system: string;
  prompt: string;
  maxTokens?: number;
};

export async function localComplete(opts: LocalCompleteOptions): Promise<string> {
  const available = await checkLmStudioHealth();
  if (!available) throw new LmStudioUnavailableError();

  const client = getLmStudioClient();
  const response = await client.chat.completions.create({
    model: getChatModel(),
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.prompt },
    ],
    max_tokens: opts.maxTokens ?? 1024,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content ?? "";
}
