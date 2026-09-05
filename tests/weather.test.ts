import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/weather/route";
const request = (query = "latitude=31.23456&longitude=121.4789") => new NextRequest(`http://localhost/api/weather?${query}`);
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("weather endpoint", () => {
  it("rejects missing and out-of-range coordinates", async () => {
    for (const query of ["", "latitude=91&longitude=1", "latitude=1&longitude=181", "latitude=NaN&longitude=1"]) expect((await GET(request(query))).status).toBe(400);
  });
  it("rounds location before requesting upstream data", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ current: { temperature_2m: 24.7, weather_code: 3 } })); vi.stubGlobal("fetch", fetcher);
    const response = await GET(request());
    expect(await response.json()).toEqual({ temperature: 25, code: 3 });
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.get("latitude")).toBe("31.23");
    expect(url.searchParams.get("longitude")).toBe("121.48");
  });
  it("returns a retryable error instead of invented weather", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await GET(request())).status).toBe(502);
  });
});

import { GET as regions } from "@/app/api/weather/regions/route";
describe("weather region search", () => {
  it("validates search input", async () => {
    expect((await regions(new NextRequest("http://localhost/api/weather/regions?name=a"))).status).toBe(400);
  });
  it("returns named regions with disambiguating details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ results: [{ name: "杭州", admin1: "浙江", country: "中国", latitude: 30.27, longitude: 120.15 }] })));
    const response = await regions(new NextRequest("http://localhost/api/weather/regions?name=杭州"));
    expect(await response.json()).toEqual({ results: [{ name: "杭州", detail: "浙江 · 中国", latitude: 30.27, longitude: 120.15 }] });
  });
});
