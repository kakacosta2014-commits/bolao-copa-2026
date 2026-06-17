import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { canPredict, isGameToday } from "@/lib/games";

export async function getParticipantGameContext(token: string) {
  const [participant, games] = await Promise.all([
    prisma.participant.findUnique({
      where: { accessToken: token },
      select: {
        id: true,
        predictions: {
          select: {
            gameId: true,
            predictedHomeScore: true,
            predictedAwayScore: true,
            predictedGoalScorer: true,
            totalPoints: true
          }
        }
      }
    }),
    prisma.game.findMany({
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        number: true,
        stage: true,
        groupName: true,
        homeTeam: true,
        awayTeam: true,
        startsAt: true,
        status: true,
        homeScore: true,
        awayScore: true
      }
    })
  ]);

  if (!participant) notFound();

  const predictionByGameId = new Map(participant.predictions.map((prediction) => [prediction.gameId, prediction]));
  const openGames = games.filter((game) => canPredict(game.startsAt));
  const blockedGames = games.filter((game) => !canPredict(game.startsAt));
  const pendingGames = openGames.filter((game) => !predictionByGameId.has(game.id));
  const predictedGames = games.filter((game) => predictionByGameId.has(game.id));
  const highlightedGameIds = new Set(pendingGames.filter((game) => isGameToday(game.startsAt)).map((game) => game.id));

  return {
    participant,
    games,
    openGames,
    blockedGames,
    pendingGames,
    predictedGames,
    predictionByGameId,
    highlightedGameIds
  };
}

export async function getParticipantSpecialContext(token: string) {
  const participant = await prisma.participant.findUnique({
    where: { accessToken: token },
    select: {
      id: true,
      predictions: { select: { totalPoints: true } },
      specialPrediction: {
        select: {
          championTeam: true,
          topScorerPlayer: true,
          totalPoints: true
        }
      }
    }
  });

  if (!participant) notFound();

  const totalPoints =
    participant.predictions.reduce((sum, prediction) => sum + prediction.totalPoints, 0) +
    (participant.specialPrediction?.totalPoints ?? 0);

  return { participant, totalPoints };
}

export async function getParticipantDisputesContext(token: string) {
  const [participant, activeDisputes] = await Promise.all([
    prisma.participant.findUnique({
      where: { accessToken: token },
      select: {
        id: true,
        disputes: {
          include: {
            dispute: {
              include: { _count: { select: { games: true } } }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    }),
    prisma.dispute.findMany({
      where: { isActive: true },
      include: { _count: { select: { games: true } } },
      orderBy: { createdAt: "asc" }
    })
  ]);

  if (!participant) notFound();

  const participantDisputeIds = new Set(participant.disputes.map((item) => item.disputeId));
  const availableDisputes = activeDisputes.filter((dispute) => !participantDisputeIds.has(dispute.id));

  return { participant, availableDisputes };
}
