import { WeatherWidget } from "@/components/weather-widget";
import { Navigation } from "@/components/navigation";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <div className="shell">
    <Navigation />
    <main className="main"><div className="weather-topbar"><WeatherWidget /></div>{children}</main>
  </div>;
}
