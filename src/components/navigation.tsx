"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, FriendsIcon, HomeIcon, NotebookIcon, SettingsIcon } from "@/components/cozy-icons";

const links = [
  ["/dashboard", "概览", HomeIcon], ["/schedule", "排班日历", CalendarIcon],
  ["/members", "成员", FriendsIcon], ["/history", "历史记录", NotebookIcon], ["/settings", "设置", SettingsIcon],
] as const;

export function Navigation({ healthy }: { healthy: boolean }) {
  const pathname = usePathname();
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark"><HomeIcon size={22} /></span><span>Duty Day</span></div>
    <nav className="nav">{links.map(([href, label, Icon]) => <Link className={pathname.startsWith(href) ? "active" : ""} href={href} key={href}><Icon size={17} />{label}</Link>)}</nav>
    <div className="sidebar-foot"><span className="status"><span className={`dot ${healthy ? "" : "warn"}`} />Worker {healthy ? "运行正常" : "需要检查"}</span></div>
  </aside>;
}
