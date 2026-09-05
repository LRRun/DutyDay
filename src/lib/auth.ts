import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "duty_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET 必须至少 32 个字符");
  return value;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function createSession(adminId: string, sessionVersion: number) {
  const payload = Buffer.from(JSON.stringify({ adminId, sessionVersion, expires: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  const secure = process.env.SESSION_COOKIE_SECURE
    ? process.env.SESSION_COOKIE_SECURE === "true"
    : (process.env.APP_URL || "http://localhost:3000").startsWith("https://");
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<{ adminId: string; sessionVersion: number } | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { adminId: string; sessionVersion: number; expires: number };
    if (data.expires <= Date.now() || !Number.isInteger(data.sessionVersion)) return null;
    const admin = await prisma.admin.findUnique({ where: { id: data.adminId }, select: { sessionVersion: true } });
    return admin?.sessionVersion === data.sessionVersion ? { adminId: data.adminId, sessionVersion: data.sessionVersion } : null;
  } catch { return null; }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}
