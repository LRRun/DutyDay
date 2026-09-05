type Level = "info" | "warn" | "error";

export function log(level: Level, service: string, event: string, message: string, extra?: Record<string, unknown>) {
  const safeExtra = extra ? Object.fromEntries(Object.entries(extra).filter(([key]) => !/password|secret|token/i.test(key))) : {};
  console[level](JSON.stringify({ timestamp: new Date().toISOString(), level, service, event, message, ...safeExtra }));
}
