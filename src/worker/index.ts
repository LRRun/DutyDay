import { createServer } from "node:http";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { tick } from "./tick";

const intervalMs = Math.max(10_000, Number(process.env.WORKER_INTERVAL_MS || 60_000));
let stopping = false;
let running: Promise<void> | null = null;

async function run() {
  if (stopping || running) return;
  running = tick().catch((error) => log("error", "worker", "scheduler.tick.failed", error instanceof Error ? error.message : "Worker tick 失败"));
  await running;
  running = null;
}

const timer = setInterval(run, intervalMs);
timer.unref();
void run();

const healthServer = createServer((_req, res) => {
  res.writeHead(stopping ? 503 : 200, { "content-type": "application/json" });
  res.end(JSON.stringify({ status: stopping ? "stopping" : "ok" }));
}).listen(3001, "0.0.0.0");

async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  log("info", "worker", "worker.shutdown", `收到 ${signal}，正在安全退出`);
  await running;
  await new Promise<void>((resolve) => healthServer.close(() => resolve()));
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
