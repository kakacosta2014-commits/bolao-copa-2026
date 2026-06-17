import { ParticipantBackToDashboard } from "@/components/ParticipantBackToDashboard";
import { ParticipantGamesSection } from "@/components/ParticipantGamesSection";
import { getParticipantGameContext } from "@/lib/participantArea";

export const dynamic = "force-dynamic";

export default async function BlockedParticipantGamesPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { blockedGames, predictionByGameId } = await getParticipantGameContext(token);

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <ParticipantBackToDashboard token={token} />
      <ParticipantGamesSection
        token={token}
        title="Jogos bloqueados"
        description="Jogos que ja comecaram ou foram encerrados, com seus palpites e pontos quando houver."
        games={blockedGames}
        predictionByGameId={predictionByGameId}
        emptyMessage="Nenhum jogo bloqueado no momento."
      />
    </main>
  );
}
