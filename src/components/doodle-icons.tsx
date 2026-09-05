import type { SVGProps } from "react";
import { CalendarIcon, SparklesIcon } from "@/components/cozy-icons";
type Props = SVGProps<SVGSVGElement> & { size?: number };
function Doodle({ size = 20, children, ...props }: Props) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>; }
export function ChevronDown(p: Props) { return <Doodle {...p}><path d="M6.5 9c1.4.8 3.7 3.9 5.5 5.2 1.7-1.3 4-4.3 5.5-5.2" /></Doodle>; }
export function ChevronLeft(p: Props) { return <Doodle {...p}><path d="M14.5 5.5C12 7.5 9 10.2 8 12c1.7 2 4.3 4.2 6.7 6.4" /></Doodle>; }
export function ChevronRight(p: Props) { return <Doodle {...p}><path d="M9.5 5.5c2.5 2 5.5 4.7 6.5 6.5-1.7 2-4.3 4.2-6.7 6.4" /></Doodle>; }
export function X(p: Props) { return <Doodle {...p}><path d="M7 6.5c2.7 3.8 6.6 7.3 10.4 10.7M17 6.8c-3.2 3-6.9 6.6-10.1 10.5" /></Doodle>; }
export function Check(p: Props) { return <Doodle {...p}><path d="m5 12 4.6 5.1C12.6 13.3 16 9.2 20 6" strokeWidth="2.2" /></Doodle>; }
export function Pencil(p: Props) { return <Doodle {...p}><path d="m5 15.4 9.8-11c1.4-1.5 5.8 2.2 4.5 3.8l-9.5 11.2-5.9 1.2Z" fill="#F3D491" /><path d="m13.3 6.2 4.2 3.8M5 15.4l4.8 4M4.6 18.1l2 1.8" /></Doodle>; }
export function GripVertical(p: Props) { return <Doodle {...p}>{[6,12,18].flatMap(y=>[8,16].map(x=><circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#DBC3A5" strokeWidth="1" />))}</Doodle>; }
export function LoaderCircle(p: Props) { return <Doodle {...p}><path d="M19.5 12a7.6 7.6 0 1 1-6.8-7.6" stroke="#A5BD8F" strokeWidth="2.5"/><path d="m15 3 1.2 2.1L19 6l-2.4 1.4-.6 2.4-1.4-2-2.5-.7 2-1.5Z" fill="#EDD08D" strokeWidth=".9" /></Doodle>; }
export function LogOut(p: Props) { return <Doodle {...p}><path d="M13 4.5 5 5v14l8 .5Z" fill="#EAD1B7"/><path d="M10 8v.1M12 12h9m-3-3 3 3-3 3" /></Doodle>; }
export function Bell(p: Props) { return <Doodle {...p}><path d="M5 16c1.4-2.3 1-6.8 2.5-9C10 3.2 16 4.5 17 8c.7 2.5.3 5.1 2 8Z" fill="#F2D69D"/><path d="M9.5 19c1.2 1.4 3.7 1.4 5 0M11 3h2" /></Doodle>; }
export function Server(p: Props) { return <Doodle {...p}><path d="M5 4.5 19 5l.5 15L4 19.5Z" fill="#DAE7CA"/><path d="M8 9h7M8 14h3"/><circle cx="16" cy="15" r="1.5" fill="#E5B09B" /></Doodle>; }
export function CircleAlert(p: Props) { return <Doodle {...p}><path d="M12 3C5 2 2 8 3.4 14 5 21 15 23 19 18c5-6 2-14-7-15Z" fill="#F7DEAD"/><path d="m12 7-.3 6M12 17h.1" /></Doodle>; }
export function CalendarClock(p: Props) { return <CalendarIcon {...p} />; }
export function CalendarOff(p: Props) { return <Doodle {...p}><path d="M4 6 20 5v15L4 19Z" fill="#F2DCE0"/><path d="M8 3v5m8-5v5M4 10h16m-11 4 6 3m0-3-6 3" /></Doodle>; }
export function Sun(p: Props) { return <Doodle {...p}><circle cx="12" cy="12" r="5.5" fill="#F4D181"/><path d="M12 2v1m0 18v1M2 12h1m18 0h1M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M10 12h.1m3.8 0h.1m-3 2c.7.6 1.4.6 2 0" strokeWidth="1.2"/></Doodle>; }
export function Cloud(p: Props) { return <Doodle {...p}><path d="M6 18C0 17 3 10 7 11 6 3 18 3 18 11c6-1 6 8 1 7Z" fill="#E5EAF2"/><path d="M9 14h.1m5 0h.1m-3 2h1" strokeWidth="1.2" /></Doodle>; }
export function Rain(p: Props) { return <Doodle {...p}><path d="M6 14C1 14 3 7 7 8 9 2 17 3 18 8c6-1 6 6 1 6Z" fill="#DCE6EC"/><path d="m7 18-1 3m6-3-1 3m6-3-1 3" stroke="#85AABD"/></Doodle>; }
export function Snow(p: Props) { return <Doodle {...p}><path d="M12 3v18M4 7l16 10M4 17 20 7m-11-3 3 3 3-3m-6 16 3-3 3 3" stroke="#8FAABC"/></Doodle>; }
export function Sparkle(p: Props) { return <SparklesIcon {...p} />; }
