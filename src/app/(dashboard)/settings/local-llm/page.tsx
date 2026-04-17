import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getIntegrationConfigs } from "@/lib/integrations/config";
import { LocalLlmClient } from "./local-llm-client";

export default async function LocalLlmSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cfg = getIntegrationConfigs("local_llm");

  return (
    <div className="mx-auto max-w-2xl">
      <LocalLlmClient
        initial={{
          base_url: cfg.base_url || "",
          chat_model: cfg.chat_model || "",
          embedding_model: cfg.embedding_model || "",
        }}
        env={{
          base_url: (process.env.LMSTUDIO_URL || "").trim() || null,
          chat_model: (process.env.LMSTUDIO_CHAT_MODEL || "").trim() || null,
          embedding_model:
            (process.env.LMSTUDIO_EMBEDDING_MODEL || "").trim() || null,
        }}
      />
    </div>
  );
}
