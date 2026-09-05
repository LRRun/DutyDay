"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, FriendsIcon, HomeIcon, NotebookIcon, SettingsIcon } from "@/components/cozy-icons";

import { ManagementLink } from "@/components/management-link";
import { CozyCompanion } from "@/components/cozy-scene";

const links = [
  ["/dashboard", "概览", HomeIcon], ["/schedule", "排班日历", CalendarIcon],
  ["/members", "成员", FriendsIcon], ["/history", "历史记录", NotebookIcon], ["/settings", "设置", SettingsIcon],
] as const;

export function Navigation() {
  const pathname = usePathname();
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark"><img className="brand-house" src="/illustrations/house-sticker.png" alt="" width={48} height={48} /></span><span><span className="brand-name">Duty Day</span><small>一起照顾每一天</small></span></div>
    <nav className="nav">{links.map(([href, label, Icon]) => <Link className={pathname.startsWith(href) ? "active" : ""} href={href} key={href} aria-current={pathname.startsWith(href) ? "page" : undefined}><Icon size={23} />{label}</Link>)}</nav>
    <div className="sidebar-note"><p>小小的值日<br />让日常多一点可爱</p><CozyCompanion /></div>
    <a className="sidebar-github" href="https://github.com/LRRun/DutyDay" target="_blank" rel="noopener noreferrer" aria-label="在 GitHub 查看 DutyDay 项目（新窗口）"><svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M12 .75a11.25 11.25 0 0 0-3.558 21.923c.563.104.769-.244.769-.542 0-.267-.01-.975-.015-1.914-3.13.68-3.79-1.508-3.79-1.508-.512-1.3-1.25-1.646-1.25-1.646-1.022-.699.078-.685.078-.685 1.13.08 1.725 1.16 1.725 1.16 1.005 1.722 2.637 1.225 3.28.937.102-.728.393-1.225.715-1.507-2.499-.284-5.126-1.25-5.126-5.563 0-1.229.44-2.233 1.16-3.02-.116-.284-.503-1.429.11-2.978 0 0 .945-.302 3.094 1.154A10.79 10.79 0 0 1 12 6.18c.956.004 1.919.129 2.818.379 2.148-1.456 3.091-1.154 3.091-1.154.615 1.549.228 2.694.112 2.978.722.787 1.158 1.791 1.158 3.02 0 4.324-2.632 5.276-5.14 5.555.404.35.764 1.043.764 2.1 0 1.517-.014 2.741-.014 3.113 0 .301.203.651.774.54A11.252 11.252 0 0 0 12 .75Z"/></svg><span>GitHub <small>LRRun / DutyDay</small></span></a>
    <div className="sidebar-account"><ManagementLink /></div>
  </aside>;
}
