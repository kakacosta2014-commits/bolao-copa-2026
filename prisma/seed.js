const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function matchResult(home, away) {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

function gamePoints(prediction, game, scorers) {
  const exact =
    prediction.predictedHomeScore === game.homeScore &&
    prediction.predictedAwayScore === game.awayScore;
  const resultCorrect =
    matchResult(prediction.predictedHomeScore, prediction.predictedAwayScore) ===
    matchResult(game.homeScore, game.awayScore);
  const scorerCorrect = scorers
    .map(normalizeName)
    .includes(normalizeName(prediction.predictedGoalScorer || ""));

  const scorePoints = exact ? 10 : 0;
  const resultPoints = !exact && resultCorrect ? 5 : 0;
  const goalScorerPoints = scorerCorrect ? 5 : 0;

  return {
    scorePoints,
    resultPoints,
    goalScorerPoints,
    totalPoints: scorePoints + resultPoints + goalScorerPoints
  };
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setMinutes(0, 0, 0);
  return date;
}

async function main() {
  const settings = await prisma.settings.findFirst();
  if (!settings) {
    await prisma.settings.create({
      data: {
        poolName: "Bolão da Copa dos Amigos",
        entryFee: 50,
        pixKey: "",
        pixReceiverName: "",
        organizerWhatsapp: "",
        organizerPercentage: 20,
        firstPlacePercentage: 40,
        secondPlacePercentage: 25,
        thirdPlacePercentage: 15,
        specialPredictionsLocked: false
      }
    });
  }

  const participants = [
    { name: "Ana Silva", whatsapp: "11999990001", accessToken: "seed-ana", paid: true },
    { name: "Bruno Costa", whatsapp: "11999990002", accessToken: "seed-bruno", paid: true },
    { name: "Carla Souza", whatsapp: "11999990003", accessToken: "seed-carla", paid: true },
    { name: "Diego Lima", whatsapp: "11999990004", accessToken: "seed-diego", paid: false }
  ];

  for (const participant of participants) {
    await prisma.participant.upsert({
      where: { accessToken: participant.accessToken },
      create: {
        ...participant,
        paidAt: participant.paid ? new Date() : null
      },
      update: {
        name: participant.name,
        whatsapp: participant.whatsapp,
        paid: participant.paid,
        paidAt: participant.paid ? new Date() : null
      }
    });
  }

  const games = [
    {
      number: 1,
      stage: "Fase de Grupos",
      groupName: "A",
      homeTeam: "Brasil",
      awayTeam: "Alemanha",
      startsAt: addDays(-3),
      status: "ENCERRADO",
      homeScore: 2,
      awayScore: 1,
      scorers: ["Vinicius Jr", "Rodrygo", "Musiala"]
    },
    {
      number: 2,
      stage: "Fase de Grupos",
      groupName: "B",
      homeTeam: "Argentina",
      awayTeam: "Franca",
      startsAt: addDays(3),
      status: "AGENDADO",
      homeScore: null,
      awayScore: null,
      scorers: []
    },
    {
      number: 3,
      stage: "Fase de Grupos",
      groupName: "C",
      homeTeam: "Espanha",
      awayTeam: "Italia",
      startsAt: addDays(-1),
      status: "AO_VIVO",
      homeScore: null,
      awayScore: null,
      scorers: []
    }
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { number: game.number },
      create: {
        number: game.number,
        stage: game.stage,
        groupName: game.groupName,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        startsAt: game.startsAt,
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        goalScorers: {
          create: game.scorers.map((playerName) => ({ playerName }))
        }
      },
      update: {
        stage: game.stage,
        groupName: game.groupName,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        startsAt: game.startsAt,
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        goalScorers: {
          deleteMany: {},
          create: game.scorers.map((playerName) => ({ playerName }))
        }
      }
    });
  }

  const savedParticipants = await prisma.participant.findMany({
    where: { accessToken: { in: participants.map((participant) => participant.accessToken) } }
  });
  const savedGames = await prisma.game.findMany({
    where: { number: { in: games.map((game) => game.number) } },
    include: { goalScorers: true }
  });
  const byToken = Object.fromEntries(savedParticipants.map((participant) => [participant.accessToken, participant]));
  const byNumber = Object.fromEntries(savedGames.map((game) => [game.number, game]));

  const predictions = [
    { token: "seed-ana", gameNumber: 1, predictedHomeScore: 2, predictedAwayScore: 1, predictedGoalScorer: "Vinícius Jr" },
    { token: "seed-bruno", gameNumber: 1, predictedHomeScore: 1, predictedAwayScore: 0, predictedGoalScorer: "Rodrygo" },
    { token: "seed-carla", gameNumber: 1, predictedHomeScore: 1, predictedAwayScore: 1, predictedGoalScorer: "Messi" },
    { token: "seed-ana", gameNumber: 2, predictedHomeScore: 2, predictedAwayScore: 2, predictedGoalScorer: "Messi" },
    { token: "seed-bruno", gameNumber: 2, predictedHomeScore: 1, predictedAwayScore: 2, predictedGoalScorer: "Mbappe" },
    { token: "seed-carla", gameNumber: 2, predictedHomeScore: 2, predictedAwayScore: 1, predictedGoalScorer: "Lautaro" }
  ];

  for (const prediction of predictions) {
    const participant = byToken[prediction.token];
    const game = byNumber[prediction.gameNumber];
    const points =
      game.homeScore === null || game.awayScore === null
        ? { scorePoints: 0, resultPoints: 0, goalScorerPoints: 0, totalPoints: 0 }
        : gamePoints(prediction, game, game.goalScorers.map((scorer) => scorer.playerName));

    await prisma.prediction.upsert({
      where: {
        participantId_gameId: {
          participantId: participant.id,
          gameId: game.id
        }
      },
      create: {
        participantId: participant.id,
        gameId: game.id,
        predictedHomeScore: prediction.predictedHomeScore,
        predictedAwayScore: prediction.predictedAwayScore,
        predictedGoalScorer: prediction.predictedGoalScorer,
        ...points
      },
      update: {
        predictedHomeScore: prediction.predictedHomeScore,
        predictedAwayScore: prediction.predictedAwayScore,
        predictedGoalScorer: prediction.predictedGoalScorer,
        ...points
      }
    });
  }

  const specialPredictions = [
    { token: "seed-ana", championTeam: "Brasil", topScorerPlayer: "Vinicius Jr" },
    { token: "seed-bruno", championTeam: "Franca", topScorerPlayer: "Mbappe" },
    { token: "seed-carla", championTeam: "Argentina", topScorerPlayer: "Messi" }
  ];

  for (const special of specialPredictions) {
    await prisma.specialPrediction.upsert({
      where: { participantId: byToken[special.token].id },
      create: {
        participantId: byToken[special.token].id,
        championTeam: special.championTeam,
        topScorerPlayer: special.topScorerPlayer
      },
      update: {
        championTeam: special.championTeam,
        topScorerPlayer: special.topScorerPlayer
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed concluido.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
