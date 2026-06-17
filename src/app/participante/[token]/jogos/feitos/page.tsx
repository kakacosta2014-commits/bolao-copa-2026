import { ParticipantBackToDashboard } from "@/components/ParticipantBackToDashboard";
import { ParticipantGamesSection } from "@/components/ParticipantGamesSection";
import { getParticipantGameContext } from "@/lib/participantArea";

export const dynamic = "force-dynamic";

export default async function CompletedParticipantGamesPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { predictedGames, predictionByGameId } = await getParticipantGameContext(token);

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <ParticipantBackToDashboard token={token} />
      <ParticipantGamesSection
        token={token}
        title="Palpites feitos"
        description="Jogos em que voce ja registrou palpite. Se o jogo ainda estiver aberto, voce pode editar."
        games={predictedGames}
        predictionByGameId={predictionByGameId}
        emptyMessage="Voce ainda nao registrou palpites."
      />
    </main>
  );
}
