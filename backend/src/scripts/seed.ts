/**
 * Seed idempotente do administrador inicial.
 *
 * Vive em `src/` de propósito: é compilado com a API, por isso em produção
 * corre com `node dist/scripts/seed.js` — sem TypeScript nem código-fonte na
 * imagem, e sem depender de caminhos que só existem em desenvolvimento.
 *
 * A palavra-passe vem SEMPRE de variáveis de ambiente: não há credenciais
 * por omissão no código nem no repositório.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { hashPassword } from "../utils/password.js";

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME?.trim() || "Administrador";

async function main(): Promise<void> {
  if (!email && !password) {
    console.warn(
      "Seed ignorado: SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD não definidos.",
    );
    return;
  }

  if (!email || !password) {
    console.error(
      "Seed abortado: define SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD em conjunto no .env.",
    );
    process.exitCode = 1;
    return;
  }

  if (password.length < 12) {
    console.error(
      "Seed abortado: SEED_ADMIN_PASSWORD deve ter pelo menos 12 caracteres.",
    );
    process.exitCode = 1;
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Seed abortado: DATABASE_URL em falta.");
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
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
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Falha no seed:", error);
  process.exitCode = 1;
});
