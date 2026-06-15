import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { calculatePrizes } from "@/lib/prizes";
import { calculateRanking, type RankingParticipant } from "@/lib/scoring";
import { getSettings } from "@/lib/settings";

export const DISPUTE_RANKING_OPTIONS = [
  { slug: "geral", label: "Geral" },
  { slug: "primeira-rodada", label: "1a Rodada" },
  { slug: "segunda-rodada", label: "2a Rodada" },
  { slug: "terceira-rodada", label: "3a Rodada" },
  { slug: "mata-mata", label: "Mata-mata" }
] as const;

export type DisputeRankingStatusFilter = "paid" | "pending" | "all";

type ParticipantDisputeRankingItem = RankingParticipant & {
  whatsapp: string;
  paymentStatus: string;
  paidAt: Date | null;
  createdAt: Date;
  predictionCount: number;
  specialsComplete: boolean;
  position: number | null;
};

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
    organizerPrizePercent: toNumber(settings.organizerPercentage),
    firstPrizePercent: toNumber(settings.firstPlacePercentage),
    secondPrizePercent: toNumber(settings.secondPlacePercentage),
    thirdPrizePercent: toNumber(settings.thirdPlacePercentage)
  });

  return { ranking, prizes, settings };
}

export async function getDisputeRankingData(
  disputeSlug: string,
  statusFilter: DisputeRankingStatusFilter = "paid"
) {
  const slug = DISPUTE_RANKING_OPTIONS.some((option) => option.slug === disputeSlug)
    ? disputeSlug
    : "geral";

  const dispute = await prisma.dispute.findUnique({
    where: { slug },
    include: {
      games: { select: { gameId: true } },
      _count: { select: { games: true, participants: true } }
    }
  });

  if (!dispute) {
    return null;
  }

  const gameIds = dispute.games.map((game) => game.gameId);
  const [paidParticipants, pendingParticipants, participantDisputes] = await Promise.all([
    prisma.participantDispute.count({
      where: { disputeId: dispute.id, paymentStatus: "PAID" }
    }),
    prisma.participantDispute.count({
      where: { disputeId: dispute.id, paymentStatus: "PENDING" }
    }),
    prisma.participantDispute.findMany({
      where: {
        disputeId: dispute.id,
        ...(statusFilter === "paid" ? { paymentStatus: "PAID" } : {}),
        ...(statusFilter === "pending" ? { paymentStatus: "PENDING" } : {})
      },
      include: {
        participant: {
          include: {
            predictions: {
              where: gameIds.length > 0 ? { gameId: { in: gameIds } } : { id: "__no_games__" }
            },
            specialPrediction: true
          }
        }
      },
      orderBy: { participant: { name: "asc" } }
    })
  ]);

  const toRankingParticipant = (
    item: (typeof participantDisputes)[number]
  ): RankingParticipant => {
    const gamePoints = item.participant.predictions.reduce(
      (total, prediction) => total + prediction.totalPoints,
      0
    );
    const exactScores = item.participant.predictions.filter((prediction) => prediction.scorePoints === 10)
      .length;
    const correctResults = item.participant.predictions.filter(
      (prediction) => prediction.resultPoints === 5
    ).length;
    const goalScorers = item.participant.predictions.filter(
      (prediction) => prediction.goalScorerPoints === 5
    ).length;
    const championPoints = dispute.includesSpecialPredictions
      ? item.participant.specialPrediction?.championPoints ?? 0
      : 0;
    const topScorerPoints = dispute.includesSpecialPredictions
      ? item.participant.specialPrediction?.topScorerPoints ?? 0
      : 0;

    return {
      id: item.participant.id,
      name: item.participant.name,
      gamePoints,
      championPoints,
      topScorerPoints,
      totalPoints: gamePoints + championPoints + topScorerPoints,
      exactScores,
      correctResults,
      goalScorers
    };
  };

  const paidRanking = calculateRanking(
    participantDisputes
      .filter((item) => item.paymentStatus === "PAID")
      .map(toRankingParticipant)
  );
  const positionByParticipantId = new Map(
    paidRanking.map((participant, index) => [participant.id, index + 1])
  );
  const pointsByParticipantId = new Map(
    participantDisputes.map((item) => [item.participant.id, toRankingParticipant(item)])
  );

  const ranking = participantDisputes
    .map<ParticipantDisputeRankingItem>((item) => {
      const points = pointsByParticipantId.get(item.participant.id) ?? toRankingParticipant(item);
      const specialsComplete = Boolean(
        item.participant.specialPrediction?.championTeam &&
          item.participant.specialPrediction?.topScorerPlayer
      );

      return {
        ...points,
        whatsapp: item.participant.whatsapp,
        paymentStatus: item.paymentStatus,
        paidAt: item.paidAt,
        createdAt: item.participant.createdAt,
        predictionCount: item.participant.predictions.length,
        specialsComplete,
        position: item.paymentStatus === "PAID" ? positionByParticipantId.get(item.participant.id) ?? null : null
      };
    })
    .sort((a, b) => {
      if (a.position && b.position) return a.position - b.position;
      if (a.position) return -1;
      if (b.position) return 1;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.name.localeCompare(b.name, "pt-BR");
    });

  const prizes = calculatePrizes(paidParticipants, dispute.entryFeeCents / 100, {
    organizerPrizePercent: dispute.organizerPrizePercent,
    firstPrizePercent: dispute.firstPrizePercent,
    secondPrizePercent: dispute.secondPrizePercent,
    thirdPrizePercent: dispute.thirdPrizePercent
  });

  return {
    dispute,
    selectedSlug: slug,
    ranking,
    prizes,
    summary: {
      totalGames: gameIds.length,
      totalParticipants: dispute._count.participants,
      paidParticipants,
      pendingParticipants,
      includesSpecialPredictions: dispute.includesSpecialPredictions
    }
  };
}
