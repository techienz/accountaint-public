"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Initial = {
  base_url: string;
  chat_model: string;
  embedding_model: string;
};

type EnvValues = {
  base_url: string | null;
  chat_model: string | null;
  embedding_model: string | null;
};

const PRESETS: Record<
  string,
  { label: string; base_url: string; chat_model: string; embedding_model: string }
> = {
  lmstudio: {
    label: "LM Studio",
    base_url: "http://localhost:1234/v1",
    chat_model: "qwen3.5-9b",
    embedding_model: "nomic-ai/nomic-embed-text-v2-moe",
  },
  lmstudio_docker: {
    label: "LM Studio (from Docker)",
    base_url: "http://host.docker.internal:1234/v1",
    chat_model: "qwen3.5-9b",
    embedding_model: "nomic-ai/nomic-embed-text-v2-moe",
  },
  ollama: {
    label: "Ollama",
    base_url: "http://localhost:11434/v1",
    chat_model: "qwen2.5:14b",
    embedding_model: "nomic-embed-text",
  },
  ollama_docker: {
    label: "Ollama (from Docker)",
    base_url: "http://host.docker.internal:11434/v1",
    chat_model: "qwen2.5:14b",
    embedding_model: "nomic-embed-text",
  },
};

export function LocalLlmClient({
  initial,
  env,
}: {
  initial: Initial;
  env: EnvValues;
}) {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState(initial.base_url);
  const [chatModel, setChatModel] = useState(initial.chat_model);
  const [embeddingModel, setEmbeddingModel] = useState(initial.embedding_model);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  function applyPreset(key: string | null) {
    if (!key || key === "custom") return;
    const preset = PRESETS[key];
    if (!preset) return;
    setBaseUrl(preset.base_url);
    setChatModel(preset.chat_model);
    setEmbeddingModel(preset.embedding_model);
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    setMessageType(null);
    try {
      const res = await fetch("/api/integrations/local-llm-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_only: true,
          base_url: baseUrl,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(
          `Connected. ${data.modelCount ?? "?"} model${data.modelCount === 1 ? "" : "s"} loaded.`
        );
        setMessageType("success");
      } else {
        setMessage(`Failed: ${data.error || "Unknown error"}`);
        setMessageType("error");
      }
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Connection test failed"
      );
      setMessageType("error");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setMessageType(null);
    try {
      const res = await fetch("/api/integrations/local-llm-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_url: baseUrl,
          chat_model: chatModel,
          embedding_model: embeddingModel,
        }),
      });
      if (res.ok) {
        setMessage("Saved.");
        setMessageType("success");
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save");
        setMessageType("error");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  const effectiveBaseUrl = baseUrl || env.base_url || "http://localhost:1234/v1";
  const isConfigured = Boolean(initial.base_url);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Local LLM</CardTitle>
            <CardDescription>
              Connect an OpenAI-compatible local LLM server (LM Studio, Ollama,
              vLLM, llama.cpp, LocalAI) for PII-sensitive tasks like OCR,
              categorisation, summarisation, and embeddings. When unavailable,
              these tasks fall back to Claude Haiku with sanitisation.
            </CardDescription>
          </div>
          <Badge variant={isConfigured ? "default" : "secondary"}>
            {isConfigured ? "Configured" : "Using defaults"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Quick preset</Label>
          <Select onValueChange={applyPreset} defaultValue="">
            <SelectTrigger>
              <SelectValue placeholder="Apply a preset..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lmstudio">LM Studio</SelectItem>
              <SelectItem value="lmstudio_docker">
                LM Studio (from Docker)
              </SelectItem>
              <SelectItem value="ollama">Ollama</SelectItem>
              <SelectItem value="ollama_docker">Ollama (from Docker)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Presets fill the fields below. You can still edit them before
            saving.
          </p>
        </div>

        <div>
          <Label htmlFor="base_url">Base URL</Label>
          <Input
            id="base_url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={env.base_url || "http://localhost:1234/v1"}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {env.base_url
              ? `Environment default: ${env.base_url}`
              : "Default if empty: http://localhost:1234/v1"}
          </p>
        </div>

        <div>
          <Label htmlFor="chat_model">Chat model</Label>
          <Input
            id="chat_model"
            value={chatModel}
            onChange={(e) => setChatModel(e.target.value)}
            placeholder={env.chat_model || "qwen3.5-9b"}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Used for OCR, categorisation, and summarisation.{" "}
            {env.chat_model ? `Environment default: ${env.chat_model}` : ""}
          </p>
        </div>

        <div>
          <Label htmlFor="embedding_model">Embedding model</Label>
          <Input
            id="embedding_model"
            value={embeddingModel}
            onChange={(e) => setEmbeddingModel(e.target.value)}
            placeholder={
              env.embedding_model || "nomic-ai/nomic-embed-text-v2-moe"
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            Must produce 768-dim vectors.{" "}
            {env.embedding_model
              ? `Environment default: ${env.embedding_model}`
              : ""}
          </p>
        </div>

        {message && (
          <p
            className={`text-sm ${
              messageType === "success"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || testing}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={saving || testing}
          >
            {testing ? "Testing..." : "Test Connection"}
          </Button>
        </div>

        <div className="rounded-md border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Effective URL: {effectiveBaseUrl}</p>
          <p>
            If you&apos;re running the app in Docker and your LLM is on the host,
            use <code>host.docker.internal</code> instead of{" "}
            <code>localhost</code>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
