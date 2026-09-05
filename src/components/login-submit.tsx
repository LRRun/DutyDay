"use client";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
export function LoginSubmit() { const { pending } = useFormStatus(); return <Button variant="primary" type="submit" disabled={pending}>{pending && <LoaderCircle className="spin" size={15} />}{pending ? "正在登录…" : "登录"}</Button>; }
