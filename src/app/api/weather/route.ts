import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const latitude = Number(params.get("latitude"));
  const longitude = Number(params.get("longitude"));
  if (!params.get("latitude") || !params.get("longitude") || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return NextResponse.json({ error: "位置信息无效" }, { status: 400 });
  }
  try {
    const query = new URLSearchParams({ latitude: latitude.toFixed(2), longitude: longitude.toFixed(2), current: "temperature_2m,weather_code", timezone: "auto" });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: AbortSignal.timeout(10000), next: { revalidate: 600 } });
    if (!response.ok) throw new Error("Weather unavailable");
    const { current } = await response.json();
    if (typeof current?.temperature_2m !== "number" || typeof current?.weather_code !== "number") throw new Error("Invalid weather");
    return NextResponse.json({ temperature: Math.round(current.temperature_2m), code: current.weather_code }, { headers: { "Cache-Control": "private, max-age=600" } });
  } catch {
    return NextResponse.json({ error: "天气暂时无法获取，请稍后重试" }, { status: 502 });
  }
}
