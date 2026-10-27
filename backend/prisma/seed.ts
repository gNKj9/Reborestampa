/**
 * Seed idempotente do administrador inicial.
 * A password vem SEMPRE de variáveis de ambiente — não há credenciais
 * por omissão no código nem no repositório.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { hashPassword } from "../src/utils/password.js";
import "dotenv/config";

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME?.trim() || "Administrador";

if (!email && !password) {
  console.warn(
    "Seed ignorado: SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD não definidos.",
  );
  process.exit(0);
}

if (!email || !password) {
  console.error(
    "Seed abortado: define SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD em conjunto no .env.",
  );
  process.exit(1);
}

if (password.length < 12) {
  console.error("Seed abortado: SEED_ADMIN_PASSWORD deve ter pelo menos 12 caracteres.");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Seed abortado: DATABASE_URL em falta.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Admin já existe (${email}) — nada a fazer.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN" },
  });

  console.log(`Admin criado: ${email}`);
}

main()
  .catch((error) => {
    console.error("Falha no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
