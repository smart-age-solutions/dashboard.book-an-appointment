/**
 * Structured client-side logger with automatic PII redaction.
 *
 * In development: human-readable console output with labels.
 * In production:  JSON-serialised objects suitable for log aggregators
 *                 (Datadog Browser Logs, Sentry, LogRocket, etc.).
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("Store fetched", { storeId, count: stores.length });
 *   logger.error("API call failed", { action: "addStore" }, error);
 */

// ---------------------------------------------------------------------------
// PII masking
// ---------------------------------------------------------------------------

/** Mask an email address — shows domain, hides local part. */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "[invalid-email]";
  const [local, domain] = email.split("@");
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}***@${domain}`;
}

/** Mask a phone number — shows last 4 digits only. */
export function maskPhone(phone: string): string {
  if (!phone) return "[no-phone]";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `****${digits.slice(-4)}` : "****";
}

const SENSITIVE_KEYS = new Set([
  "password", "passwd", "secret", "token", "api_key", "apikey",
  "auth_token", "access_token", "refresh_token", "private_key",
  "authorization", "credit_card", "card_number", "cvv",
]);

function redactSensitive(context: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context)) {
    const lower = k.toLowerCase();
    safe[k] = [...SENSITIVE_KEYS].some((s) => lower.includes(s)) ? "[REDACTED]" : v;
  }
  return safe;
}

// ---------------------------------------------------------------------------
// Log levels
// ---------------------------------------------------------------------------

type Level = "debug" | "info" | "warn" | "error";

const IS_PROD = import.meta.env.PROD;

function emit(
  level: Level,
  message: string,
  context: Record<string, unknown> = {},
  error?: unknown,
): void {
  const safeCtx = redactSensitive(context);

  if (IS_PROD) {
    // Structured JSON — forward to your log aggregator here if needed
    const payload = {
      ts: new Date().toISOString(),
      level,
      message,
      ...safeCtx,
      ...(error instanceof Error
        ? { error_name: error.name, error_message: error.message }
        : {}),
    };
    // eslint-disable-next-line no-console
    console[level === "warn" ? "warn" : level === "error" ? "error" : "log"](
      JSON.stringify(payload),
    );
  } else {
    // Human-readable in development
    const prefix = `[${level.toUpperCase()}]`;
    const extra = Object.keys(safeCtx).length ? safeCtx : undefined;
    if (level === "error") {
      // eslint-disable-next-line no-console
      console.error(prefix, message, ...(extra ? [extra] : []), ...(error ? [error] : []));
    } else if (level === "warn") {
      // eslint-disable-next-line no-console
      console.warn(prefix, message, ...(extra ? [extra] : []));
    } else {
      // eslint-disable-next-line no-console
      console.log(prefix, message, ...(extra ? [extra] : []));
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit("debug", msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => emit("info",  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => emit("warn",  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>, err?: unknown) =>
    emit("error", msg, ctx, err),
};
