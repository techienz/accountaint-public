import { decrypt } from "@/lib/crypto";
import type { EmailConfig } from "./email";

/**
 * Build a runtime EmailConfig from a stored notificationPreferences config blob.
 * Returns null if the config is incomplete for whichever provider is selected.
 * Decrypts secrets along the way.
 */
export function buildEmailConfig(
  raw: Record<string, string> | null
): EmailConfig | null {
  if (!raw) return null;

  const provider = raw.provider === "graph" ? "graph" : "smtp";

  if (!raw.to_address) return null;

  if (provider === "graph") {
    if (!raw.tenant_id || !raw.client_id || !raw.client_secret || !raw.from_address) {
      return null;
    }
    return {
      provider: "graph",
      tenant_id: raw.tenant_id,
      client_id: raw.client_id,
      client_secret: decrypt(raw.client_secret),
      from_address: raw.from_address,
      to_address: raw.to_address,
    };
  }

  if (!raw.smtp_host) return null;
  return {
    provider: "smtp",
    smtp_host: raw.smtp_host,
    smtp_port: parseInt(raw.smtp_port || "587", 10) || 587,
    smtp_user: raw.smtp_user || "",
    smtp_pass: raw.smtp_pass ? decrypt(raw.smtp_pass) : "",
    from_address: raw.from_address || raw.smtp_user || "",
    to_address: raw.to_address,
  };
}
