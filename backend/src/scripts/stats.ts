import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

/**
 * Fotografia rápida do estado da base de dados.
 *
 * Serve para validar um restauro do Neon ("os números batem certo?") e para
 * perceber o estado do sistema sem abrir o painel.
 *
 *   DATABASE_URL=postgresql://... npm run db:stats
 *
 * Constrói o seu próprio cliente para não depender das validações de ambiente
 * da API (JWT, CORS) — só precisa da base de dados.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Define DATABASE_URL antes de correr este comando.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString, max: 2 }),
});

async function main(): Promise<void> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    usersTotal,
    usersActive,
    adminsActive,
    contactsTotal,
    contactsByStatus,
    contactsLastWeek,
    auditTotal,
    lastAudit,
    lastContact,
    resetActive,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "ADMIN", isActive: true } }),
    prisma.contactRequest.count(),
    prisma.contactRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contactRequest.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.auditLog.count(),
    prisma.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, action: true, actorEmail: true },
    }),
    prisma.contactRequest.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, name: true, status: true },
    }),
    prisma.passwordResetToken.count({
      where: { usedAt: null, expiresAt: { gt: now } },
    }),
  ]);

  const statuses = Object.fromEntries(
    contactsByStatus.map((row) => [row.status, row._count._all]),
  );

  console.log(`Base de dados — ${now.toISOString()}`);
  console.log("");
  console.log(`Utilizadores: ${usersTotal} (${usersActive} ativos, ${adminsActive} admins ativos)`);
  console.log(`Pedidos de contacto: ${contactsTotal} (${contactsLastWeek} nos últimos 7 dias)`);
  console.log(
    `  novos ${statuses.NEW ?? 0} · lidos ${statuses.READ ?? 0} · respondidos ${statuses.REPLIED ?? 0} · arquivados ${statuses.ARCHIVED ?? 0}`,
  );
  console.log(`Registos de auditoria: ${auditTotal}`);
  console.log(`Links de recuperação válidos: ${resetActive}`);
  console.log("");
  console.log(
    lastContact
      ? `Último pedido: ${lastContact.name} (${lastContact.status}) em ${lastContact.createdAt.toISOString()}`
      : "Último pedido: —",
  );
  console.log(
    lastAudit
      ? `Última ação: ${lastAudit.action} por ${lastAudit.actorEmail ?? "sistema"} em ${lastAudit.createdAt.toISOString()}`
      : "Última ação: —",
  );

  if (adminsActive < 2) {
    console.log("");
    console.log(
      "AVISO: só existe um administrador ativo. Cria uma segunda conta para não depender de uma pessoa.",
    );
  }
}

main()
  .catch((error) => {
    console.error("Falha ao ler a base de dados:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
