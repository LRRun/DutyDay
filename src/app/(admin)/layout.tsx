import { Navigation } from "@/components/navigation";
import { logoutAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const state = await prisma.workerState.findUnique({ where: { id: 1 } });
  const healthy = !!state?.lastTickAt && Date.now() - state.lastTickAt.getTime() < 5 * 60_000;
  return <div className="shell">
    <Navigation healthy={healthy} />
    <main className="main"><header className="topbar"><span className="status"><span className={`dot ${healthy ? "" : "warn"}`} />{healthy ? "系统运行正常" : "后台任务需要检查"}</span><form action={logoutAction}><Button variant="ghost" size="sm">退出登录</Button></form></header>{children}</main>
  </div>;
}
