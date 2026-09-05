import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" });

export function HomeIcon({ size = 20, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M4.5 10.6 12 4.4l7.5 6.2v8.2a1.7 1.7 0 0 1-1.7 1.7H6.2a1.7 1.7 0 0 1-1.7-1.7v-8.2Z" fill="#DDEEDC" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9.2 20.5v-5.7h5.6v5.7M8.2 9.8h.1M15.7 9.8h.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}

export function CalendarIcon({ size = 20, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><rect x="3.2" y="5.2" width="17.6" height="15.3" rx="3.2" fill="#F5E5EE" stroke="currentColor" strokeWidth="1.6"/><path d="M7.5 3.5v3.4M16.5 3.5v3.4M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="m8 14 1.4 1.4L12.2 12" stroke="#78977D" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function FriendsIcon({ size = 20, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><circle cx="9" cy="8" r="3.2" fill="#E4E1F4" stroke="currentColor" strokeWidth="1.5"/><circle cx="16.4" cy="9.2" r="2.5" fill="#F6E3E8" stroke="currentColor" strokeWidth="1.5"/><path d="M3.8 19.7c.4-3.3 2.2-5.1 5.2-5.1s4.8 1.8 5.2 5.1M13.2 15.7c.8-.8 1.8-1.2 3.2-1.2 2.3 0 3.7 1.5 3.9 4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}

export function NotebookIcon({ size = 20, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><rect x="5" y="3.3" width="15" height="17.4" rx="3" fill="#F4E9D7" stroke="currentColor" strokeWidth="1.6"/><path d="M8.4 3.5v17M3.5 7.5h3M3.5 12h3M3.5 16.5h3M11.5 8.2h5M11.5 12h5M11.5 15.8h3.3" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></svg>;
}

export function SettingsIcon({ size = 20, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M12 3.5a2 2 0 0 1 1.9 1.4l.2.8c.3.1.6.3.9.5l.8-.3a2 2 0 0 1 2.4.9l.7 1.2a2 2 0 0 1-.4 2.5l-.6.5v1.1l.6.5a2 2 0 0 1 .4 2.5l-.7 1.2a2 2 0 0 1-2.4.9l-.8-.3-.9.5-.2.8a2 2 0 0 1-1.9 1.4h-1.4a2 2 0 0 1-1.9-1.4l-.2-.8-.9-.5-.8.3a2 2 0 0 1-2.4-.9l-.7-1.2a2 2 0 0 1 .4-2.5l.6-.5V11l-.6-.5A2 2 0 0 1 3.7 8l.7-1.2a2 2 0 0 1 2.4-.9l.8.3.9-.5.2-.8a2 2 0 0 1 1.9-1.4H12Z" fill="#E7E2F4" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round"/><circle cx="11.3" cy="12" r="2.6" fill="#FFFDF8" stroke="currentColor" strokeWidth="1.45"/></svg>;
}

export function SparklesIcon({ size = 22, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M11.8 3.2c.5 3.2 2.1 4.9 5.2 5.4-3.1.5-4.7 2.2-5.2 5.4-.5-3.2-2.1-4.9-5.2-5.4 3.1-.5 4.7-2.2 5.2-5.4Z" fill="#F2C96D" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round"/><path d="M18.2 13.1c.3 1.8 1.2 2.8 3 3.1-1.8.3-2.7 1.3-3 3.1-.3-1.8-1.2-2.8-3-3.1 1.8-.3 2.7-1.3 3-3.1ZM5.2 14.3c.2 1.2.8 1.9 2 2.1-1.2.2-1.8.9-2 2.1-.2-1.2-.8-1.9-2-2.1 1.2-.2 1.8-.9 2-2.1Z" fill="#F2DFA5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>;
}

export function PlantIcon({ size = 44, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M8 13.3h8.2l-1.1 6.5H9.2L8 13.3Z" fill="#F1D6CD" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round"/><path d="M12 13.2c-.1-3.5 1.5-6.3 4.7-8.2.2 3.6-1.3 6.1-4.7 8.2ZM11.7 11.7C8.3 11.2 6.2 9.3 5.3 6c3.5.3 5.6 2.1 6.4 5.7Z" fill="#D9E9D4" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round"/></svg>;
}

export type AnimalKind = "cat" | "dog" | "rabbit" | "bear";
export function animalFor(value: string): AnimalKind {
  const kinds: AnimalKind[] = ["cat", "dog", "rabbit", "bear"];
  return kinds[[...value].reduce((total, char) => total + char.charCodeAt(0), 0) % kinds.length];
}

export function AnimalAvatar({ kind, size = 54, className, ...props }: IconProps & { kind: AnimalKind }) {
  const fills = { cat:"#F4D8DE", dog:"#EAD8BF", rabbit:"#DEDDF0", bear:"#D8E8D5" };
  return <svg {...base(size)} className={`animal-avatar ${className || ""}`} {...props} aria-hidden="true">
    <g fill={fills[kind]} stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round">{kind === "cat" && <path d="m6.3 8.2.6-4 3.4 2.4c.6-.2 1.2-.3 1.8-.3.7 0 1.3.1 1.9.3l3.3-2.4.6 4c1.2 1.2 1.9 2.7 1.9 4.5 0 4.2-3.5 7.4-7.8 7.4s-7.8-3.2-7.8-7.4c0-1.8.8-3.4 2.1-4.5Z"/>}{kind === "dog" && <path d="M7.6 6.2C8.8 5.4 10.3 5 12 5c1.6 0 3 .4 4.2 1.1 1.6-1.1 3.1-.9 3.7-.5.4 2.3-.1 4-1.1 5 .2.7.3 1.3.3 2.1 0 4.2-3.2 7.4-7.1 7.4s-7.1-3.2-7.1-7.4c0-.7.1-1.4.3-2.1-1.1-1-1.6-2.7-1.1-5 .6-.4 2-.6 3.5.6Z"/>}{kind === "rabbit" && <path d="M8.3 7.3C7.4 3.9 8 1.9 9.3 1.6c1.5-.3 2.5 2 2.8 4.7h.2c.4-2.7 1.4-4.9 2.8-4.7 1.4.3 1.9 2.4 1 5.8 2.3 1.3 3.7 3.5 3.7 6.2 0 3.8-3.4 6.6-7.7 6.6s-7.7-2.8-7.7-6.6c0-2.7 1.5-5 3.9-6.3Z"/>}{kind === "bear" && <><circle cx="6.4" cy="7" r="2.8"/><circle cx="17.6" cy="7" r="2.8"/><path d="M4.8 12.7C4.8 8.5 8 5.4 12 5.4s7.2 3.1 7.2 7.3-3.2 7.4-7.2 7.4-7.2-3.2-7.2-7.4Z"/></>}</g>
    <path d="M9.2 12h.1M14.7 12h.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M11.1 14.3c.5.4 1.3.4 1.8 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>;
}
