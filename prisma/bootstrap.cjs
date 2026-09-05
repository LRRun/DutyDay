const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.scheduleSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.rotationState.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.workerState.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
