"use client";
import * as SwitchPrimitive from "@radix-ui/react-switch";
export function Switch(props: React.ComponentProps<typeof SwitchPrimitive.Root>) { return <SwitchPrimitive.Root className="switch-root" {...props}><SwitchPrimitive.Thumb className="switch-thumb" /></SwitchPrimitive.Root>; }
