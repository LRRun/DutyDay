import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim() || "";
  if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "请输入 2 至 80 个字符的地区名称" }, { status: 400 });
  try {
    const query = new URLSearchParams({ name, language: "zh", count: "10", format: "json" });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${query}`, { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } });
    if (!response.ok) throw new Error("Unavailable");
    const data = await response.json();
    const results = (Array.isArray(data.results) ? data.results : []).filter((r: Record<string, unknown>) => typeof r.name === "string" && typeof r.latitude === "number" && typeof r.longitude === "number").map((r: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }) => ({ name: r.name, detail: [r.admin1, r.country].filter(Boolean).join(" · "), latitude: r.latitude, longitude: r.longitude }));
    return NextResponse.json({ results });
  } catch { return NextResponse.json({ error: "地区搜索暂时不可用，请重试或选择常用城市" }, { status: 502 }); }
}
