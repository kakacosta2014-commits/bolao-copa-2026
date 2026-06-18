import Link from "next/link";
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
  const pendingRedirectPath = `/participante/${token}/jogos/faltam`;
  const firstPendingId = pendingGames[0]?.id;
  const flowHighlights = new Set(highlightedGameIds);
  if (firstPendingId) flowHighlights.add(firstPendingId);

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <ParticipantBackToDashboard token={token} />
      {pendingGames.length > 0 ? (
        <>
          <section className="card stack pending-flow-intro">
            <h1>Faltam fazer</h1>
            <p>Voce ainda tem {pendingGames.length} palpites pendentes.</p>
            <p className="muted compact-text">Preencha um por vez. Ao salvar, o proximo jogo pendente aparecera aqui.</p>
          </section>
          <ParticipantGamesSection
            token={token}
            title="Proximo palpite"
            description="O primeiro jogo pendente fica destacado para voce continuar em sequencia."
            games={pendingGames}
            predictionByGameId={predictionByGameId}
            highlightedGameIds={flowHighlights}
            emptyMessage="Voce ja fez todos os palpites disponiveis no momento."
            redirectAfterSave={pendingRedirectPath}
          />
        </>
      ) : (
        <section className="card stack pending-flow-complete">
          <h1>Parabens!</h1>
          <p>Voce fez todos os palpites disponiveis no momento.</p>
          <div className="participant-form-actions">
            <Link className="button" href={`/participante/${token}/jogos/feitos`}>
              Ver palpites feitos
            </Link>
            <Link className="button secondary" href={`/participante/${token}`}>
              Voltar ao painel
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
