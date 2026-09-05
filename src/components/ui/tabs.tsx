"use client";
import * as TabsPrimitive from "@radix-ui/react-tabs";
export const Tabs = TabsPrimitive.Root;
export const TabsContent = ({ className = "", ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => <TabsPrimitive.Content className={`tabs-content ${className}`} {...props} />;
export function TabsList({ children }: { children: React.ReactNode }) { return <TabsPrimitive.List className="tabs-list">{children}</TabsPrimitive.List>; }
export function TabsTrigger(props: React.ComponentProps<typeof TabsPrimitive.Trigger>) { return <TabsPrimitive.Trigger className="tabs-trigger" {...props} />; }
