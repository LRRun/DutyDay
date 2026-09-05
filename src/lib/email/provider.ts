import nodemailer from "nodemailer";

export interface EmailProvider {
  sendEmail(input: { to: string; subject: string; text: string; html: string }): Promise<{ messageId: string }>;
}

class SmtpEmailProvider implements EmailProvider {
  private transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  async sendEmail(input: { to: string; subject: string; text: string; html: string }) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) throw new Error("SMTP 尚未配置");
    const result = await this.transport.sendMail({ from: process.env.SMTP_FROM, ...input });
    return { messageId: result.messageId };
  }
}

export function getEmailProvider(): EmailProvider {
  if ((process.env.EMAIL_PROVIDER || "smtp") !== "smtp") throw new Error("不支持的邮件 Provider");
  return new SmtpEmailProvider();
}
