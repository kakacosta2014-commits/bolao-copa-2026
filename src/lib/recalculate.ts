import { prisma } from "@/lib/db";
import { calculateGamePredictionPoints, calculateSpecialPoints } from "@/lib/scoring";
import { getSettings } from "@/lib/settings";

export async function recalculateGame(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { goalScorers: true, predictions: true }
  });
  if (!game) return;

  await Promise.all(
    game.predictions.map((prediction) => {
      const points = calculateGamePredictionPoints({
        predictedHomeScore: prediction.predictedHomeScore,
        predictedAwayScore: prediction.predictedAwayScore,
        predictedGoalScorer: prediction.predictedGoalScorer,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        goalScorers: game.goalScorers.map((scorer) => scorer.playerName)
      });

      return prisma.prediction.update({
        where: { id: prediction.id },
        data: points
      });
    })
  );
}

export async function recalculateSpecials() {
  const settings = await getSettings();
  const predictions = await prisma.specialPrediction.findMany();

  await Promise.all(
    predictions.map((prediction) => {
      const points = calculateSpecialPoints(
        prediction.championTeam,
        prediction.topScorerPlayer,
        settings.officialChampion,
        settings.officialTopScorers
      );

      return prisma.specialPrediction.update({
        where: { id: prediction.id },
        data: points
      });
    })
  );
}
