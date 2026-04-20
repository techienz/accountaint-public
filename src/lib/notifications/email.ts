import nodemailer from "nodemailer";
import {
  sendEmailViaGraph,
  type GraphConfig,
  type GraphEmailAttachment,
} from "./graph-email";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

export type SmtpConfig = {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string; // decrypted
  from_address: string;
  to_address: string;
};

/**
 * Unified email config. Selects the transport via `provider`.
 *  - "smtp"  → nodemailer over SMTP (any provider that allows SMTP AUTH)
 *  - "graph" → Microsoft Graph API (Office 365, no SMTP AUTH needed)
 */
export type EmailConfig =
  | ({ provider?: "smtp" } & SmtpConfig)
  | ({ provider: "graph" } & GraphConfig);

export async function sendEmail(
  config: EmailConfig,
  subject: string,
  html: string,
  attachments?: EmailAttachment[],
  cc?: string[]
): Promise<void> {
  const wrapped = wrapHtml(html);

  if (config.provider === "graph") {
    const graphAttachments: GraphEmailAttachment[] | undefined = attachments?.map(
      (a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })
    );
    await sendEmailViaGraph(config, subject, wrapped, graphAttachments, cc);
    return;
  }

  // Default: SMTP
  const smtp = config as SmtpConfig & { provider?: "smtp" };
  const transporter = nodemailer.createTransport({
    host: smtp.smtp_host,
    port: smtp.smtp_port,
    secure: smtp.smtp_port === 465,
    auth: {
      user: smtp.smtp_user,
      pass: smtp.smtp_pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from_address,
    to: smtp.to_address,
    cc: cc && cc.length > 0 ? cc.join(", ") : undefined,
    subject,
    html: wrapped,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
  .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
</style></head>
<body>
${body}
<div class="footer">Sent by Accountaint</div>
</body>
</html>`;
}
