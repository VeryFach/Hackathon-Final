import crypto from "crypto";
 
const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";
 
type AIEvent =
  | "submission.created"
  | "submission.updated"
  | "payout.paid"
  | "batch.approved";
 
/**
 * Fire-and-forget POST to the AI service webhook.
 * Errors are logged but never thrown — the AI service is non-critical.
 */
export async function notifyAIService(
  event: AIEvent,
  id: string
): Promise<void> {
  const body = JSON.stringify({ event, id });
 
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
 
  // Attach HMAC signature if a secret is configured
  if (WEBHOOK_SECRET) {
    const sig = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(body)
      .digest("hex");
    headers["X-Webhook-Signature"] = `sha256=${sig}`;
  }
 
  try {
    const res = await fetch(`${AI_SERVICE_URL}/webhook/new-data`, {
      method: "POST",
      headers,
      body,
    });
    if (!res.ok) {
      console.warn(
        `[AI webhook] Non-OK response ${res.status} for event=${event} id=${id}`
      );
    }
  } catch (err) {
    console.error("[AI webhook] Failed to notify AI service:", err);
  }
}
 