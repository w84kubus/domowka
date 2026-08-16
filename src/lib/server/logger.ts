import "server-only";

// F2 (UPGRADE.md §F): Logowanie błędów po stronie serwera z kodem pokoju i fazą.
// Bez nicków i bez identyfikatorów graczy — RODO/prywatność.
// W Vercel logi idą przez stdout/stderr → widoczne w dashboardzie.

interface LogContext {
  room?: string;
  phase?: string;
  game?: string;
  action?: string;
}

function format(level: string, msg: string, ctx?: LogContext): string {
  const parts = [level, msg];
  if (ctx?.room) parts.push(`room=${ctx.room}`);
  if (ctx?.game) parts.push(`game=${ctx.game}`);
  if (ctx?.phase) parts.push(`phase=${ctx.phase}`);
  if (ctx?.action) parts.push(`action=${ctx.action}`);
  return parts.join(" ");
}

export const logger = {
  info: (msg: string, ctx?: LogContext) => console.log(format("[INFO]", msg, ctx)),
  warn: (msg: string, ctx?: LogContext) => console.warn(format("[WARN]", msg, ctx)),
  error: (msg: string, ctx?: LogContext, err?: unknown) => {
    console.error(format("[ERROR]", msg, ctx), err instanceof Error ? err.message : err ?? "");
  },
};
