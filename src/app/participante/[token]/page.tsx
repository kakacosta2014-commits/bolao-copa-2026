import { notFound } from "next/navigation";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";
import { MessageBanner } from "@/components/MessageBanner";
import { ParticipantHomeDashboard } from "@/components/ParticipantHomeDashboard";
import { prisma } from "@/lib/db";
import { canPredict } from "@/lib/games";
import { TokenSaver } from "./TokenSaver";

export const dynamic = "force-dynamic";

export default async function ParticipantPage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { token } = await params;
  const { ok, erro } = await searchParams;
  const [participant, games] = await Promise.all([
    prisma.participant.findUnique({
      where: { accessToken: token },
      include: {
        predictions: true,
        specialPrediction: true,
        disputes: {
          include: {
            dispute: { select: { isActive: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    }),
    prisma.game.findMany({ orderBy: { startsAt: "asc" } })
  ]);

  if (!participant) notFound();

  const predictionByGameId = new Map(participant.predictions.map((prediction) => [prediction.gameId, prediction]));
  const totalPoints =
    participant.predictions.reduce((sum, prediction) => sum + prediction.totalPoints, 0) +
    (participant.specialPrediction?.totalPoints ?? 0);
  const openGames = games.filter((game) => canPredict(game.startsAt));
  const blockedGames = games.filter((game) => !canPredict(game.startsAt));
  const pendingGames = openGames.filter((game) => !predictionByGameId.has(game.id));
  const activeDisputes = participant.disputes.filter((item) => item.dispute.isActive);

  return (
    <main id="topo" className="container stack" style={{ padding: "2rem 0" }}>
      <TokenSaver token={token} />
      <MessageBanner ok={ok} erro={erro} />
      <InstallAppPrompt />
      <ParticipantHomeDashboard
        token={token}
        participantName={participant.name}
        paymentConfirmed={participant.paid}
        totalPoints={totalPoints}
        pendingPredictions={pendingGames.length}
        completedPredictions={participant.predictions.length}
        blockedGames={blockedGames.length}
        activeDisputes={activeDisputes.length}
      />
    </main>
  );
}
