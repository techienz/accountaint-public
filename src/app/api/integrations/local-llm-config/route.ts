import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getIntegrationConfigs,
  setIntegrationConfig,
} from "@/lib/integrations/config";
import { testLmStudioConnection } from "@/lib/lmstudio/client";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cfg = getIntegrationConfigs("local_llm");
  return NextResponse.json({
    base_url: cfg.base_url || "",
    chat_model: cfg.chat_model || "",
    embedding_model: cfg.embedding_model || "",
    env_base_url: (process.env.LMSTUDIO_URL || "").trim() || null,
    env_chat_model: (process.env.LMSTUDIO_CHAT_MODEL || "").trim() || null,
    env_embedding_model:
      (process.env.LMSTUDIO_EMBEDDING_MODEL || "").trim() || null,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    base_url?: string;
    chat_model?: string;
    embedding_model?: string;
    test_only?: boolean;
  };

  if (body.test_only) {
    const result = await testLmStudioConnection(body.base_url);
    return NextResponse.json(result);
  }

  if (body.base_url !== undefined) {
    setIntegrationConfig("local_llm", "base_url", body.base_url.trim());
  }
  if (body.chat_model !== undefined) {
    setIntegrationConfig("local_llm", "chat_model", body.chat_model.trim());
  }
  if (body.embedding_model !== undefined) {
    setIntegrationConfig(
      "local_llm",
      "embedding_model",
      body.embedding_model.trim()
    );
  }

  return NextResponse.json({ success: true });
}
