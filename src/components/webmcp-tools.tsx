"use client";

import { useEffect } from "react";

declare global {
  interface Document {
    modelContext?: {
      registerTool(tool: {
        name: string; title: string; description: string; inputSchema: object;
        annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
        execute(input: unknown): unknown | Promise<unknown>;
      }, options?: { signal?: AbortSignal }): void | Promise<void>;
    };
  }
}

export function DashboardWebMcpTools({ nextAssignment, workerHealthy }: {
  nextAssignment: { date: string; members: string[]; notificationStatus: string } | null;
  workerHealthy: boolean;
}) {
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "read_duty_status",
      title: "读取值日状态",
      description: "读取当前页面展示的下一次正式值日排班和 Worker 健康状态。",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({ nextAssignment, workerHealthy }),
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [nextAssignment, workerHealthy]);
  return null;
}
