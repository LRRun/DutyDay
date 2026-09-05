import Link from "next/link";
export default function NotFound() { return <main className="login"><section className="login-card"><h1>页面不存在</h1><p className="muted">地址可能已更改。</p><Link className="ui-button ui-button-primary" href="/dashboard" style={{ marginTop: 18 }}>返回概览</Link></section></main>; }
