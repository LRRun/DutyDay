import Mustache from "mustache";

export const DEFAULT_EMAIL_TEMPLATES = {
  dayBeforeSubject: "明天轮到你值日",
  dayBeforeBody: "你好，{{recipient_name}}：\n\n明天（{{duty_date}}）轮到你和 {{partner_name}} 负责值日。\n\n本次值日成员：\n{{member_1_name}}\n{{member_2_name}}\n\n请记得按时完成值日。",
  sameDaySubject: "今天轮到你值日",
  sameDayBody: "你好，{{recipient_name}}：\n\n今天（{{duty_date}}）轮到你和 {{partner_name}} 负责值日。\n\n本次值日成员：\n{{member_1_name}}\n{{member_2_name}}\n\n请记得按时完成值日。",
} as const;

export const EMAIL_TEMPLATE_VARIABLES = [
  { key: "recipient_name", label: "收件人姓名" },
  { key: "partner_name", label: "搭档姓名" },
  { key: "duty_date", label: "值日日期" },
  { key: "member_1_name", label: "成员 1 姓名" },
  { key: "member_2_name", label: "成员 2 姓名" },
] as const;

export type EmailTemplateVariables = Record<(typeof EMAIL_TEMPLATE_VARIABLES)[number]["key"], string>;

export class EmailTemplateValidationError extends Error {}

function validateField(value: string, field: "主题" | "正文") {
  const limit = field === "主题" ? 160 : 10_000;
  if (!value.trim()) throw new EmailTemplateValidationError(`邮件${field}不能为空`);
  if (value.length > limit) throw new EmailTemplateValidationError(`邮件${field}不能超过 ${limit} 个字符`);
  if (field === "主题" && /[\r\n]/.test(value)) throw new EmailTemplateValidationError("邮件主题不能换行");

  try { Mustache.parse(value); } catch { throw new EmailTemplateValidationError(`邮件${field}中的变量语法不正确`); }
  const allowed = new Set(EMAIL_TEMPLATE_VARIABLES.map((item) => item.key));
  for (const tag of value.match(/{{{?[\s\S]*?}?}}/g) || []) {
    const match = tag.match(/^{{\s*([a-z0-9_]+)\s*}}$/i);
    if (!match) throw new EmailTemplateValidationError(`邮件${field}只支持 {{变量名}} 格式`);
    if (!allowed.has(match[1] as EmailTemplateVariables extends Record<infer K, string> ? K : never)) {
      throw new EmailTemplateValidationError(`邮件${field}包含未知变量：${match[1]}`);
    }
  }
}

export function validateEmailTemplate(subjectTemplate: string, bodyTemplate: string) {
  validateField(subjectTemplate, "主题");
  validateField(bodyTemplate, "正文");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]!);
}

export function renderEmailTemplate(subjectTemplate: string, bodyTemplate: string, variables: EmailTemplateVariables) {
  validateEmailTemplate(subjectTemplate, bodyTemplate);
  const renderOptions = { escape: (value: string) => value };
  const subject = Mustache.render(subjectTemplate, variables, undefined, renderOptions);
  const text = Mustache.render(bodyTemplate, variables, undefined, renderOptions);
  if (/\r|\n/.test(subject)) throw new EmailTemplateValidationError("渲染后的邮件主题不能换行");
  return { subject, text, html: `<div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.65;color:#202124">${escapeHtml(text).replace(/\r?\n/g, "<br>")}</div>` };
}
