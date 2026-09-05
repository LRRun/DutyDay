import { describe, expect, it } from "vitest";
import { EmailTemplateValidationError, renderEmailTemplate, validateEmailTemplate } from "@/domain/notifications/email-template";

const variables = {
  recipient_name: "小王 <主管>",
  partner_name: "小陈",
  duty_date: "2026-09-05",
  member_1_name: "小王",
  member_2_name: "小陈",
};

describe("email templates", () => {
  it("renders all supported variables in subject and body", () => {
    const result = renderEmailTemplate(
      "{{duty_date}} 值日提醒",
      "{{recipient_name}} 与 {{partner_name}}\n{{member_1_name}} / {{member_2_name}}",
      variables,
    );
    expect(result.subject).toBe("2026-09-05 值日提醒");
    expect(result.text).toContain("小王 <主管> 与 小陈");
  });

  it("escapes member data in HTML without changing plain text", () => {
    const result = renderEmailTemplate("值日提醒", "你好，{{recipient_name}}", variables);
    expect(result.text).toBe("你好，小王 <主管>");
    expect(result.html).toContain("小王 &lt;主管&gt;");
    expect(result.html).not.toContain("小王 <主管>");
  });

  it("rejects unknown variables", () => {
    expect(() => validateEmailTemplate("提醒", "{{unknown_name}}"))
      .toThrowError(new EmailTemplateValidationError("邮件正文包含未知变量：unknown_name"));
  });

  it("rejects unescaped Mustache syntax", () => {
    expect(() => validateEmailTemplate("提醒", "{{{recipient_name}}}"))
      .toThrow("邮件正文只支持 {{变量名}} 格式");
  });

  it("rejects newlines in the email subject", () => {
    expect(() => validateEmailTemplate("提醒\nBcc: someone@example.com", "正文"))
      .toThrow("邮件主题不能换行");
  });
});
