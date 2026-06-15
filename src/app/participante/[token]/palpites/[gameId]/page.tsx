import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamBadge } from "@/components/TeamBadge";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageParams = {
  token: string;
  gameId: string;
};

type PredictionScore = {
  predictedHomeScore: number;
  predictedAwayScore: number;
};

function formatPredictionScore(prediction: PredictionScore) {
  return `${prediction.predictedHomeScore} x ${prediction.predictedAwayScore}`;
}

export default async function ParticipantGamePredictionsPage({
  params
}: {
  params: Promise<PageParams>;
}) {
  const { token, gameId } = await params;
  const [participant, game] = await Promise.all([
    prisma.participant.findUnique({
      where: { accessToken: token },
      select: { id: true }
    }),
    prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        number: true,
        stage: true,
        groupName: true,
        homeTeam: true,
        awayTeam: true,
        startsAt: true,
        status: true
      }
    })
  ]);

  if (!participant || !game) notFound();

  const predictionsAreReleased = new Date() >= game.startsAt;
  const predictions = predictionsAreReleased
    ? await prisma.prediction.findMany({
        where: {
          gameId: game.id,
          participant: {
            disputes: {
              some: {
                paymentStatus: "PAID",
                dispute: { slug: "geral" }
              }
            }
          }
        },
        select: {
          id: true,
          predictedHomeScore: true,
          predictedAwayScore: true,
          predictedGoalScorer: true,
          totalPoints: true,
          createdAt: true,
          updatedAt: true,
          participant: {
            select: { name: true }
          }
        },
        orderBy: { participant: { name: "asc" } }
      })
    : [];

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <Link className="button secondary participant-back-button" href={`/participante/${token}#bloqueados`}>
        Voltar aos meus palpites
      </Link>

      <section className="card stack">
        <div className="section-heading">
          <div>
            <h1>Palpites da galera</h1>
            <strong className="matchup-line">
              <span>Jogo {game.number}:</span>
              <TeamBadge teamName={game.homeTeam} />
              <span>x</span>
              <TeamBadge teamName={game.awayTeam} />
            </strong>
            <p className="muted compact-text">
              {game.stage} {game.groupName ? `- Grupo ${game.groupName}` : ""} - {formatDateTime(game.startsAt)} - Horario de Brasilia
            </p>
            <p className="muted compact-text">Status do jogo: {game.status}</p>
          </div>
          <span className={`status-pill ${predictionsAreReleased ? "status-paid" : "status-blocked"}`}>
            {predictionsAreReleased ? "Palpites liberados" : "Palpites serao liberados quando o jogo comecar"}
          </span>
        </div>
      </section>

      {!predictionsAreReleased ? (
        <p className="warning-text">Os palpites deste jogo serao liberados quando a partida comecar.</p>
      ) : (
        <section className="stack">
          <div className="card participant-predictions-desktop">
            <table className="participant-predictions-table">
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Palpite</th>
                  <th>Jogador-gol</th>
                  <th>Pontos</th>
                  <th>Enviado em</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((prediction) => (
                  <tr key={prediction.id}>
                    <td><strong>{prediction.participant.name}</strong></td>
                    <td>
                      <span className="matchup-score">
                        <TeamBadge teamName={game.homeTeam} />
                        <span>{formatPredictionScore(prediction)}</span>
                        <TeamBadge teamName={game.awayTeam} />
                      </span>
                    </td>
                    <td>{prediction.predictedGoalScorer || "Nenhum jogador informado"}</td>
                    <td>{prediction.totalPoints}</td>
                    <td>{formatDateTime(prediction.updatedAt ?? prediction.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {predictions.length === 0 ? (
              <p className="muted">Ainda nao ha palpites registrados para este jogo.</p>
            ) : null}
          </div>

          <div className="participant-predictions-mobile stack">
            {predictions.map((prediction) => (
              <article key={prediction.id} className="card stack participant-public-prediction-card">
                <div className="section-heading">
                  <strong>{prediction.participant.name}</strong>
                  <span className="status-pill">{prediction.totalPoints} pontos</span>
                </div>
                <div className="prediction-card-grid">
                  <Metric label="Palpite" value={formatPredictionScore(prediction)} />
                  <Metric label="Jogador-gol" value={prediction.predictedGoalScorer || "Nenhum jogador informado"} />
                  <Metric label="Pontos" value={prediction.totalPoints} />
                  <Metric label="Enviado em" value={formatDateTime(prediction.updatedAt ?? prediction.createdAt)} />
                </div>
              </article>
            ))}
            {predictions.length === 0 ? (
              <p className="card muted">Ainda nao ha palpites registrados para este jogo.</p>
            ) : null}
          </div>
        </section>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
