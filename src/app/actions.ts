"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, requireAdmin } from "@/lib/auth";
import { EmailTemplateValidationError, renderEmailTemplate, validateEmailTemplate } from "@/domain/notifications/email-template";
import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/lib/email/provider";
import { log } from "@/lib/logger";
import { recalculateNextAssignment, reconcileNextAssignment } from "@/services/scheduler-service";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

function knownError(error: unknown): string {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "请检查填写内容";
  if (error instanceof EmailTemplateValidationError) return error.message;
  if (error instanceof Error && ["至少需要启用一个值日星期", "至少需要 2 名参与值日的成员", "无效时区", "当前密码不正确", "SMTP 尚未配置"].includes(error.message)) return error.message;
  return "操作未完成，请稍后重试";
}

async function mutate(event: string, work: () => Promise<void>, success: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await work();
    revalidatePath("/", "layout");
    return { ok: true, message: success };
  } catch (error) {
    log("error", "web", event, error instanceof Error ? error.message : "unknown error");
    return { ok: false, message: knownError(error) };
  }
}

export async function loginAction(formData: FormData) {
  const parsed = z.object({ email: z.string().trim().email(), password: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=invalid");
  const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  const now = new Date();
  if (admin?.lockedUntil && admin.lockedUntil > now) redirect("/login?error=locked");
  const dummyHash = "$2b$12$LQv3c1yqBW8VHsU8xIYhVeLjZ7SftfY7sL2D6kbCPzcJ.1qWtFImK";
  const valid = await bcrypt.compare(parsed.data.password, admin?.passwordHash || dummyHash);
  if (!admin || !valid) {
    if (admin) {
      const failures = admin.failedLoginCount + 1;
      await prisma.admin.update({ where: { id: admin.id }, data: failures >= 5
        ? { failedLoginCount: 0, lockedUntil: new Date(now.getTime() + 15 * 60_000) }
        : { failedLoginCount: failures },
      });
      if (failures >= 5) redirect("/login?error=locked");
    }
    redirect("/login?error=credentials");
  }
  await prisma.admin.update({ where: { id: admin.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now } });
  await createSession(admin.id, admin.sessionVersion);
  redirect("/dashboard");
}

export async function logoutAction() { await destroySession(); redirect("/login"); }

const memberSchema = z.object({
  name: z.string().trim().min(1, "请填写姓名").max(80, "姓名不能超过 80 个字符"),
  email: z.union([z.string().trim().email("邮箱格式不正确"), z.literal("")]),
});

export async function addMemberAction(formData: FormData) {
  return mutate("member.create.failed", async () => {
    const data = memberSchema.parse(Object.fromEntries(formData));
    const aggregate = await prisma.member.aggregate({ _max: { sortOrder: true } });
    await prisma.member.create({ data: { name: data.name, email: data.email || null, sortOrder: (aggregate._max.sortOrder ?? -1) + 1 } });
    await reconcileNextAssignment();
  }, "成员已添加");
}

export async function updateMemberAction(formData: FormData) {
  return mutate("member.update.failed", async () => {
    const data = memberSchema.extend({ id: z.string().min(1) }).parse(Object.fromEntries(formData));
    await prisma.member.update({ where: { id: data.id }, data: { name: data.name, email: data.email || null } });
    await reconcileNextAssignment();
  }, "成员资料已保存");
}

export async function toggleMemberAction(formData: FormData) {
  return mutate("member.toggle.failed", async () => {
    const id = z.string().parse(formData.get("id"));
    const member = await prisma.member.findUniqueOrThrow({ where: { id } });
    await prisma.member.update({ where: { id }, data: { active: !member.active } });
    await reconcileNextAssignment();
  }, "成员状态已更新");
}

export async function deleteMemberAction(formData: FormData) {
  return mutate("member.delete.failed", async () => {
    const id = z.string().parse(formData.get("id"));
    await prisma.member.delete({ where: { id } });
    await reconcileNextAssignment();
  }, "成员已删除，历史排班保持不变");
}

export async function reorderMembersAction(ids: string[]): Promise<ActionResult> {
  return mutate("member.reorder.failed", async () => {
    const known = await prisma.member.findMany({ where: { id: { in: ids } }, select: { id: true } });
    if (known.length !== ids.length || new Set(ids).size !== ids.length) throw new Error("成员顺序无效");
    await prisma.$transaction(ids.map((id, sortOrder) => prisma.member.update({ where: { id }, data: { sortOrder } })));
    await reconcileNextAssignment();
  }, "成员顺序已保存");
}

export async function updateScheduleAction(formData: FormData) {
  return mutate("schedule.update.failed", async () => {
    const keys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
    if (!keys.some((key) => formData.get(key) === "on")) throw new Error("至少需要启用一个值日星期");
    const weekdays = Object.fromEntries(keys.map((key) => [key, formData.get(key) === "on"]));
    await prisma.scheduleSettings.upsert({ where: { id: 1 }, create: { id: 1, ...weekdays }, update: weekdays });
    await reconcileNextAssignment();
  }, "值日星期已保存");
}

export async function updateNotificationAction(formData: FormData) {
  return mutate("notification.settings.failed", async () => {
    const parsed = z.object({
      notificationTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "提醒时间格式不正确"),
      notificationMode: z.enum(["day_before", "same_day", "both"]),
      timezone: z.string().trim().min(1, "请填写时区").max(80),
      dayBeforeSubjectTemplate: z.string(),
      dayBeforeBodyTemplate: z.string(),
      sameDaySubjectTemplate: z.string(),
      sameDayBodyTemplate: z.string(),
    }).parse(Object.fromEntries(formData));
    try { new Intl.DateTimeFormat("en-US", { timeZone: parsed.timezone }); } catch { throw new Error("无效时区"); }
    validateEmailTemplate(parsed.dayBeforeSubjectTemplate, parsed.dayBeforeBodyTemplate);
    validateEmailTemplate(parsed.sameDaySubjectTemplate, parsed.sameDayBodyTemplate);
    const emailEnabled = formData.get("emailEnabled") === "on";
    await prisma.scheduleSettings.upsert({ where: { id: 1 }, create: { id: 1, ...parsed, emailEnabled }, update: { ...parsed, emailEnabled } });
    await prisma.notificationLog.deleteMany({ where: { status: { in: ["pending", "failed"] } } });
  }, "通知设置已保存");
}

const exceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "请选择日期"),
  reason: z.string().trim().min(1, "请填写原因").max(120, "原因不能超过 120 个字符"),
});

export async function addExceptionAction(formData: FormData) {
  return mutate("exception.create.failed", async () => {
    const data = exceptionSchema.parse(Object.fromEntries(formData));
    await prisma.scheduleException.upsert({ where: { date: new Date(`${data.date}T00:00:00.000Z`) }, update: { reason: data.reason }, create: { date: new Date(`${data.date}T00:00:00.000Z`), reason: data.reason } });
    await reconcileNextAssignment();
  }, "跳过日期已保存");
}

export async function updateExceptionAction(formData: FormData) {
  return mutate("exception.update.failed", async () => {
    const data = exceptionSchema.extend({ id: z.string().min(1) }).parse(Object.fromEntries(formData));
    await prisma.scheduleException.update({ where: { id: data.id }, data: { date: new Date(`${data.date}T00:00:00.000Z`), reason: data.reason } });
    await reconcileNextAssignment();
  }, "跳过日期已更新");
}

export async function deleteExceptionAction(formData: FormData) {
  return mutate("exception.delete.failed", async () => {
    await prisma.scheduleException.delete({ where: { id: z.string().parse(formData.get("id")) } });
    await reconcileNextAssignment();
  }, "跳过日期已删除");
}

export async function changePasswordAction(formData: FormData) {
  return mutate("admin.password.failed", async () => {
    const session = await requireAdmin();
    const data = z.object({
      currentPassword: z.string().min(1, "请填写当前密码"),
      newPassword: z.string().min(12, "新密码至少需要 12 个字符").max(128),
      confirmPassword: z.string(),
    }).refine((value) => value.newPassword === value.confirmPassword, { message: "两次输入的新密码不一致" }).parse(Object.fromEntries(formData));
    const admin = await prisma.admin.findUniqueOrThrow({ where: { id: session.adminId } });
    if (!(await bcrypt.compare(data.currentPassword, admin.passwordHash))) throw new Error("当前密码不正确");
    const updated = await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(data.newPassword, 12), sessionVersion: { increment: 1 } } });
    await createSession(updated.id, updated.sessionVersion);
  }, "密码已更新");
}

export async function sendTestEmailAction() {
  return mutate("notification.test.failed", async () => {
    const session = await requireAdmin();
    const admin = await prisma.admin.findUniqueOrThrow({ where: { id: session.adminId } });
    const settings = await prisma.scheduleSettings.findUniqueOrThrow({ where: { id: 1 } });
    const sample = renderEmailTemplate(settings.dayBeforeSubjectTemplate, settings.dayBeforeBodyTemplate, {
      recipient_name: "测试收件人", partner_name: "测试搭档", duty_date: "2026-09-05", member_1_name: "测试收件人", member_2_name: "测试搭档",
    });
    await getEmailProvider().sendEmail({ to: admin.email, ...sample, subject: `[测试] ${sample.subject}` });
  }, "已用保存的模板发送测试邮件到管理员邮箱");
}

export async function recalculateAction() {
  return mutate("assignment.recalculate.failed", async () => { await recalculateNextAssignment(); }, "下一次排班已重新计算");
}

export async function keepAssignmentAction() {
  return mutate("assignment.keep.failed", async () => { await prisma.scheduleSettings.update({ where: { id: 1 }, data: { pendingRuleChange: false } }); }, "已保留当前排班");
}
