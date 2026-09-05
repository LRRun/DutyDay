const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || !email.includes("@")) throw new Error("ADMIN_EMAIL 必须是有效邮箱");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD 必须至少 12 个字符");
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (!existingAdmin) await prisma.admin.create({ data: { email, passwordHash: await bcrypt.hash(password, 12) } });
  await prisma.scheduleSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.rotationState.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.workerState.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
