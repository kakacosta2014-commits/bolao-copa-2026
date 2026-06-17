import { ParticipantBackToDashboard } from "@/components/ParticipantBackToDashboard";
import { ParticipantGamesSection } from "@/components/ParticipantGamesSection";
import { getParticipantGameContext } from "@/lib/participantArea";

export const dynamic = "force-dynamic";

export default async function PendingParticipantGamesPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { pendingGames, predictionByGameId, highlightedGameIds } = await getParticipantGameContext(token);

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <ParticipantBackToDashboard token={token} />
      <ParticipantGamesSection
        token={token}
        title="Faltam fazer"
        description="Jogos abertos em que voce ainda nao registrou palpite."
        games={pendingGames}
        predictionByGameId={predictionByGameId}
        highlightedGameIds={highlightedGameIds}
        emptyMessage="Voce ja fez todos os palpites disponiveis no momento."
      />
    </main>
  );
}
