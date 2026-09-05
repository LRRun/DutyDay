"use client";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="content"><div className="error-page"><div><CircleAlert size={28} className="muted" style={{ margin: "0 auto 14px" }} /><h1 style={{ fontSize: "1.1rem" }}>页面暂时无法加载</h1><p className="muted">请检查数据库连接或稍后重试。</p><Button onClick={reset} style={{ marginTop: 12 }}>重试</Button></div></div></div>; }
