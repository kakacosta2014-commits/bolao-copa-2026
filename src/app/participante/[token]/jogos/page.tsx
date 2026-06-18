import { ParticipantBackToDashboard } from "@/components/ParticipantBackToDashboard";
import { ParticipantGamesSection } from "@/components/ParticipantGamesSection";
import { getParticipantGameContext } from "@/lib/participantArea";

export const dynamic = "force-dynamic";

export default async function AllParticipantGamesPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { games, predictionByGameId } = await getParticipantGameContext(token);

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <ParticipantBackToDashboard token={token} />
      <ParticipantGamesSection
        token={token}
        title="Todos os jogos"
        description="Visao geral de jogos abertos, palpites feitos e jogos bloqueados."
        games={games}
        predictionByGameId={predictionByGameId}
        emptyMessage="Nenhum jogo cadastrado ainda."
        redirectAfterSave={`/participante/${token}/jogos`}
      />
    </main>
  );
}
