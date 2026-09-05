const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "change-me-now";
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) await prisma.admin.create({ data: { email, passwordHash: await bcrypt.hash(password, 12) } });
  await prisma.scheduleSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.rotationState.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.workerState.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const members = [
    ["张三", "zhangsan@example.com"], ["李四", "lisi@example.com"], ["王五", "wangwu@example.com"],
    ["赵六", "zhaoliu@example.com"], ["钱七", "qianqi@example.com"], ["孙八", "sunba@example.com"], ["周九", "zhoujiu@example.com"],
  ];
  if (await prisma.member.count() === 0) await prisma.member.createMany({ data: members.map(([name, email], sortOrder) => ({ name, email, sortOrder })) });
  for (const [date, reason] of [["2026-10-01", "国庆节"], ["2026-10-02", "国庆节"]]) {
    await prisma.scheduleException.upsert({ where: { date: new Date(`${date}T00:00:00.000Z`) }, update: {}, create: { date: new Date(`${date}T00:00:00.000Z`), reason } });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
