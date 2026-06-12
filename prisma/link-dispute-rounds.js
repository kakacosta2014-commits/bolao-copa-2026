const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ROUND_SLUGS = {
  first: "primeira-rodada",
  second: "segunda-rodada",
  third: "terceira-rodada"
};

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isGroupStage(game) {
  return normalize(game.stage).includes("grupo");
}

function splitGroupStageRounds(groupGames) {
  if (groupGames.length === 72) {
    return {
      first: groupGames.slice(0, 24),
      second: groupGames.slice(24, 48),
      third: groupGames.slice(48, 72),
      ignored: []
    };
  }

  if (groupGames.length === 71 && groupGames[0]?.number === 2) {
    return {
      first: groupGames.slice(0, 23),
      second: groupGames.slice(23, 47),
      third: groupGames.slice(47, 71),
      ignored: []
    };
  }

  throw new Error(
    `Não foi possível classificar rodadas com segurança. Jogos de fase de grupos encontrados: ${groupGames.length}.`
  );
}

async function createLinks(dispute, games, dryRun) {
  if (dryRun) return games.length;

  const result = await prisma.disputeGame.createMany({
    data: games.map((game) => ({ disputeId: dispute.id, gameId: game.id })),
    skipDuplicates: true
  });

  return result.count;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const [games, disputes, disputeCounts] = await Promise.all([
    prisma.game.findMany({
      orderBy: [{ number: "asc" }, { startsAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        number: true,
        startsAt: true,
        stage: true,
        groupName: true,
        homeTeam: true,
        awayTeam: true
      }
    }),
    prisma.dispute.findMany({
      where: { slug: { in: Object.values(ROUND_SLUGS) } },
      select: { id: true, slug: true }
    }),
    prisma.dispute.findMany({
      select: { slug: true, _count: { select: { games: true } } },
      orderBy: { slug: "asc" }
    })
  ]);

  const disputeBySlug = new Map(disputes.map((dispute) => [dispute.slug, dispute]));
  for (const slug of Object.values(ROUND_SLUGS)) {
    if (!disputeBySlug.has(slug)) throw new Error(`Disputa não encontrada: ${slug}`);
  }

  const groupGames = games.filter(isGroupStage);
  const knockoutGames = games.filter((game) => !isGroupStage(game));
  const rounds = splitGroupStageRounds(groupGames);

  const linked = {
    first: await createLinks(disputeBySlug.get(ROUND_SLUGS.first), rounds.first, dryRun),
    second: await createLinks(disputeBySlug.get(ROUND_SLUGS.second), rounds.second, dryRun),
    third: await createLinks(disputeBySlug.get(ROUND_SLUGS.third), rounds.third, dryRun)
  };

  console.log(dryRun ? "Modo dry-run: nenhum vínculo foi gravado." : "Vínculos de rodadas processados.");
  console.log(`Total de jogos: ${games.length}`);
  console.log(`Jogos de fase de grupos: ${groupGames.length}`);
  console.log(`Jogos de mata-mata: ${knockoutGames.length}`);
  console.log("Vínculos atuais por disputa:");
  for (const dispute of disputeCounts) {
    console.log(`- ${dispute.slug}: ${dispute._count.games}`);
  }
  console.log(`1ª Rodada vinculada: ${dryRun ? rounds.first.length : linked.first} jogos${dryRun ? " (previstos)" : " novos"}`);
  console.log(`2ª Rodada vinculada: ${dryRun ? rounds.second.length : linked.second} jogos${dryRun ? " (previstos)" : " novos"}`);
  console.log(`3ª Rodada vinculada: ${dryRun ? rounds.third.length : linked.third} jogos${dryRun ? " (previstos)" : " novos"}`);
  console.log(`Jogos ignorados: ${rounds.ignored.length}`);
  console.log(`Faixa 1ª Rodada: jogos ${rounds.first[0]?.number} a ${rounds.first.at(-1)?.number}`);
  console.log(`Faixa 2ª Rodada: jogos ${rounds.second[0]?.number} a ${rounds.second.at(-1)?.number}`);
  console.log(`Faixa 3ª Rodada: jogos ${rounds.third[0]?.number} a ${rounds.third.at(-1)?.number}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
