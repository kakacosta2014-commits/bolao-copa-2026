const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const disputes = [
  {
    name: "Bolão Geral",
    slug: "geral",
    description: "Disputa principal com todos os jogos e palpites especiais.",
    entryFeeCents: 5000,
    kind: "GERAL",
    isActive: true,
    includesSpecialPredictions: true
  },
  {
    name: "1ª Rodada",
    slug: "primeira-rodada",
    description: "Disputa reservada para jogos da primeira rodada da fase de grupos.",
    entryFeeCents: 5000,
    kind: "RODADA_1",
    isActive: true,
    includesSpecialPredictions: false
  },
  {
    name: "2ª Rodada",
    slug: "segunda-rodada",
    description: "Disputa reservada para jogos da segunda rodada da fase de grupos.",
    entryFeeCents: 5000,
    kind: "RODADA_2",
    isActive: true,
    includesSpecialPredictions: false
  },
  {
    name: "3ª Rodada",
    slug: "terceira-rodada",
    description: "Disputa reservada para jogos da terceira rodada da fase de grupos.",
    entryFeeCents: 5000,
    kind: "RODADA_3",
    isActive: true,
    includesSpecialPredictions: false
  },
  {
    name: "Mata-mata",
    slug: "mata-mata",
    description: "Disputa reservada para jogos eliminatórios.",
    entryFeeCents: 5000,
    kind: "MATA_MATA",
    isActive: true,
    includesSpecialPredictions: false
  }
];

function isGroupStage(stage) {
  const normalized = String(stage ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return normalized.includes("grupo");
}

async function main() {
  const disputeBySlug = new Map();

  for (const dispute of disputes) {
    const saved = await prisma.dispute.upsert({
      where: { slug: dispute.slug },
      create: dispute,
      update: dispute
    });
    disputeBySlug.set(saved.slug, saved);
  }

  const geral = disputeBySlug.get("geral");
  const mataMata = disputeBySlug.get("mata-mata");
  const [games, participants] = await Promise.all([
    prisma.game.findMany({
      select: { id: true, stage: true }
    }),
    prisma.participant.findMany({
      select: { id: true, paid: true, paidAt: true }
    })
  ]);

  await prisma.disputeGame.createMany({
    data: games.map((game) => ({ disputeId: geral.id, gameId: game.id })),
    skipDuplicates: true
  });

  const knockoutGames = games.filter((game) => !isGroupStage(game.stage));
  await prisma.disputeGame.createMany({
    data: knockoutGames.map((game) => ({ disputeId: mataMata.id, gameId: game.id })),
    skipDuplicates: true
  });

  await prisma.participantDispute.createMany({
    data: participants.map((participant) => ({
      participantId: participant.id,
      disputeId: geral.id,
      paymentStatus: participant.paid ? "PAID" : "PENDING",
      paidAt: participant.paidAt
    })),
    skipDuplicates: true
  });

  for (const participant of participants) {
    await prisma.participantDispute.update({
      where: {
        participantId_disputeId: {
          participantId: participant.id,
          disputeId: geral.id
        }
      },
      data: {
        paymentStatus: participant.paid ? "PAID" : "PENDING",
        paidAt: participant.paidAt
      }
    });
  }

  console.log("Disputas inicializadas com segurança.");
  console.log(`Bolão Geral vinculado a ${games.length} jogos.`);
  console.log(`Mata-mata vinculado a ${knockoutGames.length} jogos por stage fora de fase de grupos.`);
  console.log(`Participantes vinculados ao Bolão Geral: ${participants.length}.`);
  console.log("1ª, 2ª e 3ª Rodada foram criadas sem jogos porque o schema atual não possui rodada/matchday confiável.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
