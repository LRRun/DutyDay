"use client";
import { Toaster as Sonner } from "sonner";
import { Check, CircleAlert, Bell, LoaderCircle, X } from "@/components/doodle-icons";
export function Toaster() { return <Sonner icons={{ success: <Check />, error: <CircleAlert />, warning: <CircleAlert />, info: <Bell />, loading: <LoaderCircle className="spin" />, close: <X size={14} /> }} theme="light" position="bottom-right" richColors closeButton toastOptions={{ style: { borderRadius: 14 } }} />; }
