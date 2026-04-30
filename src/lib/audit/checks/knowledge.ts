import { getKnowledgeStatus } from "@/lib/knowledge/status";
import type { Check } from "../types";

/**
 * RAG index sanity. Fail if zero docs (chat has nothing to cite). Warn if the
 * knowledge base hasn't been refreshed recently (rate / threshold changes
 * could be missing).
 */
export const knowledgeIndexCheck: Check = {
  name: "RAG knowledge base index",
  category: "Knowledge",
  async run() {
    try {
      const status = await getKnowledgeStatus();
      if (status.chunkCount === 0) {
        return {
          status: "fail",
          message: "RAG index is empty — chat cannot cite IRD sources. Run knowledge ingest from Settings → Knowledge.",
        };
      }
      if (status.freshnessState === "stale") {
        return {
          status: "warn",
          message: `${status.chunkCount} chunks across ${status.guideCount} guides, but oldest fetch is ${status.daysSinceUpdate ?? "?"} days ago. Consider refreshing.`,
        };
      }
      const missing = status.totalRequired - status.loadedCount;
      if (missing > 0) {
        return {
          status: "warn",
          message: `${status.loadedCount}/${status.totalRequired} expected IRD guides loaded — ${missing} missing.`,
        };
      }
      return {
        status: "pass",
        message: `${status.chunkCount} chunks across ${status.guideCount} guides. Last fetched ${status.daysSinceUpdate ?? 0}d ago.`,
      };
    } catch (err) {
      return {
        status: "fail",
        message: `Knowledge store unreachable: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
