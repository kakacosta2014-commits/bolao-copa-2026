import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { calculatePrizes, calculateRanking } from "@/lib/scoring";
import { getSettings } from "@/lib/settings";

export async function getRankingData() {
  const [participants, paidParticipants, settings] = await Promise.all([
    prisma.participant.findMany({
      where: { paid: true },
      include: { predictions: true, specialPrediction: true }
    }),
    prisma.participant.count({ where: { paid: true } }),
    getSettings()
  ]);

  const ranking = calculateRanking(
    participants.map((participant) => {
      const gamePoints = participant.predictions.reduce(
        (total, prediction) => total + prediction.totalPoints,
        0
      );
      const exactScores = participant.predictions.filter((prediction) => prediction.scorePoints === 10)
        .length;
      const correctResults = participant.predictions.filter(
        (prediction) => prediction.resultPoints === 5
      ).length;
      const goalScorers = participant.predictions.filter(
        (prediction) => prediction.goalScorerPoints === 5
      ).length;
      const championPoints = participant.specialPrediction?.championPoints ?? 0;
      const topScorerPoints = participant.specialPrediction?.topScorerPoints ?? 0;

      return {
        id: participant.id,
        name: participant.name,
        gamePoints,
        championPoints,
        topScorerPoints,
        totalPoints: gamePoints + championPoints + topScorerPoints,
        exactScores,
        correctResults,
        goalScorers
      };
    })
  );

  const prizes = calculatePrizes(paidParticipants, toNumber(settings.entryFee), {
    organizerPercentage: toNumber(settings.organizerPercentage),
    firstPlacePercentage: toNumber(settings.firstPlacePercentage),
    secondPlacePercentage: toNumber(settings.secondPlacePercentage),
    thirdPlacePercentage: toNumber(settings.thirdPlacePercentage)
  });

  return { ranking, prizes, settings };
}
