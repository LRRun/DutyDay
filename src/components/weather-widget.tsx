"use client";
import { useEffect, useRef, useState } from "react";
import { Sun, Cloud, Rain, Snow, LoaderCircle, ChevronDown, X } from "@/components/doodle-icons";

import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

function weather(code: number) {
  if (code === 0) return { label: "晴天", Icon: Sun };
  if (code <= 3) return { label: "多云", Icon: Cloud };
  if (code === 45 || code === 48) return { label: "有雾", Icon: Cloud };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "下雪", Icon: Snow };
  if (code >= 95) return { label: "雷雨", Icon: Rain };
  return { label: "下雨", Icon: Rain };
}
type Region = { name: string; detail?: string; latitude: number; longitude: number };
const storageKey = "dutyday.weather.region.v1";
const popular: Region[] = [
  { name: "北京", latitude: 39.90, longitude: 116.41 }, { name: "上海", latitude: 31.23, longitude: 121.47 },
  { name: "广州", latitude: 23.13, longitude: 113.26 }, { name: "深圳", latitude: 22.54, longitude: 114.06 },
  { name: "杭州", latitude: 30.27, longitude: 120.15 }, { name: "成都", latitude: 30.57, longitude: 104.07 },
  { name: "武汉", latitude: 30.59, longitude: 114.31 }, { name: "南京", latitude: 32.06, longitude: 118.80 },
];
export function WeatherWidget() {
  const [region, setRegion] = useState<Region | null>(null);
  const [data, setData] = useState<{ temperature: number; code: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Region[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searched, setSearched] = useState(false);
  const [retry, setRetry] = useState(0);
  const [storageError, setStorageError] = useState("");
  const searchController = useRef<AbortController | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && typeof saved.name === "string" && Number.isFinite(saved.latitude) && Number.isFinite(saved.longitude) && Math.abs(saved.latitude) <= 90 && Math.abs(saved.longitude) <= 180) setRegion(saved);
    } catch { /* A missing or invalid saved choice opens the region picker normally. */ }
    return () => searchController.current?.abort();
  }, []);
  useEffect(() => {
    if (!region) return;
    const controller = new AbortController();
    async function refresh() {
      setBusy(true); setError("");
      try {
        const params = new URLSearchParams({ latitude: region!.latitude.toFixed(2), longitude: region!.longitude.toFixed(2) });
        const response = await fetch(`/api/weather?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "天气暂时无法获取");
        if (!controller.signal.aborted) setData(result);
      } catch (cause) { if (!controller.signal.aborted) { setData(null); setError(cause instanceof Error ? cause.message : "天气暂时无法获取"); } }
      finally { if (!controller.signal.aborted) setBusy(false); }
    }
    setData(null); void refresh();
    const timer = setInterval(refresh, 15 * 60 * 1000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [region, retry]);
  function choose(next: Region) {
    setRegion(next); setOpen(false); setStorageError("");
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setStorageError("浏览器未允许保存地区，本次选择仍然有效"); }
  }
  async function search(event: React.FormEvent) {
    event.preventDefault(); searchController.current?.abort();
    const controller = new AbortController(); searchController.current = controller;
    setSearching(true); setSearchError(""); setResults([]); setSearched(false);
    try {
      const response = await fetch(`/api/weather/regions?${new URLSearchParams({ name: query.trim() })}`, { signal: controller.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "地区搜索失败");
      if (!controller.signal.aborted) { setResults(result.results); setSearched(true); }
    } catch (cause) { if (!controller.signal.aborted) setSearchError(cause instanceof Error ? cause.message : "地区搜索失败"); }
    finally { if (!controller.signal.aborted) setSearching(false); }
  }
  const { label, Icon } = data ? weather(data.code) : { label: "今天的天气", Icon: Sun };
  return <div className="weather-widget">
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild><button type="button" className="weather-button" aria-label="选择天气地区">
        <span className="weather-picture">{busy ? <LoaderCircle size={30} className="spin" /> : <Icon size={34} />}</span>
        <span><strong>{data ? `${data.temperature}° · ${label}` : busy ? "正在获取天气…" : region ? "天气暂不可用" : label}</strong><small>{region ? `${region.name} · 切换地区` : "选择地区，看看晴雨"}</small></span><ChevronDown size={15} />
      </button></Dialog.Trigger>
      <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content weather-dialog">
        <Dialog.Title className="dialog-title">选择天气地区</Dialog.Title>
        <Dialog.Description className="dialog-description">选择后会记在当前浏览器，下次打开自动显示。</Dialog.Description>
        <form className="weather-search" onSubmit={search}><input className="input" aria-label="地区名称" placeholder="输入城市或区县，如杭州" value={query} onChange={e => setQuery(e.target.value)} minLength={2} maxLength={80} required /><Button type="submit" disabled={searching || query.trim().length < 2}>{searching ? "搜索中…" : "搜索"}</Button></form>
        <div className="weather-results" aria-live="polite">{searchError && <p className="weather-error">{searchError}</p>}{searched && results.length === 0 && <p className="muted small">没有找到该地区，试试城市名或拼音。</p>}{results.map((item, i) => <button className="weather-region" type="button" key={`${item.latitude}-${item.longitude}-${i}`} onClick={() => choose(item)}><strong>{item.name}</strong><small>{item.detail}</small></button>)}</div>
        <p className="small muted">常用城市</p><div className="weather-cities">{popular.map(item => <Button key={item.name} size="sm" onClick={() => choose(item)}>{item.name}</Button>)}</div>
        <a className="weather-source" href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noreferrer">地区数据 GeoNames / Open-Meteo</a>
        <Dialog.Close asChild><Button variant="ghost" size="icon" className="dialog-close" aria-label="关闭"><X size={17} /></Button></Dialog.Close>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
    {error && <p className="weather-error" role="status">{error} <button type="button" className="weather-retry" onClick={() => setRetry(v => v + 1)}>重试</button></p>}
    {storageError && <p className="weather-error" role="status">{storageError}</p>}
    {data && <a className="weather-source" href="https://open-meteo.com/" target="_blank" rel="noreferrer">天气数据 Open-Meteo</a>}
  </div>;
}
