import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamBadge } from "@/components/TeamBadge";
import { joinDispute } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageParams = {
  token: string;
  slug: string;
};

type DisputeGameItem = {
  game: {
    id: string;
    number: number;
    stage: string;
    groupName: string | null;
    homeTeam: string;
    awayTeam: string;
    startsAt: Date;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
  };
};

function getParticipantStatus(paymentStatus?: string) {
  if (paymentStatus === "PAID") return { label: "Pago", className: "status-paid" };
  if (paymentStatus === "PENDING") return { label: "Pendente", className: "status-pending" };
  return { label: "Nao participa", className: "status-ended" };
}

function getGameStatus(game: DisputeGameItem["game"]) {
  if (game.homeScore !== null && game.awayScore !== null) {
    return { label: "Resultado lancado", className: "status-paid" };
  }
  if (new Date() >= game.startsAt) {
    return { label: "Bloqueado", className: "status-blocked" };
  }
  return { label: "Aberto", className: "status-open" };
}

function formatFinalScore(game: DisputeGameItem["game"]) {
  if (game.homeScore === null || game.awayScore === null) return "Aguardando resultado";
  return `${game.homeScore} x ${game.awayScore}`;
}

export default async function ParticipantDisputeGamesPage({
  params
}: {
  params: Promise<PageParams>;
}) {
  const { token, slug } = await params;
  const [participant, dispute] = await Promise.all([
    prisma.participant.findUnique({
      where: { accessToken: token },
      select: { id: true }
    }),
    prisma.dispute.findUnique({
      where: { slug },
      include: {
        games: {
          include: {
            game: {
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
            }
          }
        },
        participants: {
          where: { participant: { accessToken: token } },
          select: { paymentStatus: true }
        }
      }
    })
  ]);

  if (!participant || !dispute) notFound();

  const participantDispute = dispute.participants[0] ?? null;
  const canViewDispute = Boolean(participantDispute) || dispute.isActive;
  if (!canViewDispute) notFound();

  const participantStatus = getParticipantStatus(participantDispute?.paymentStatus);
  const games = [...dispute.games].sort((a, b) => {
    const dateDiff = a.game.startsAt.getTime() - b.game.startsAt.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.game.number - b.game.number;
  });

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <Link className="button secondary participant-back-button" href={`/participante/${token}/minhas-disputas`}>
        Voltar as minhas disputas
      </Link>

      <section className="card stack">
        <div className="section-heading">
          <div>
            <h1>{dispute.name}</h1>
            <p className="muted">{dispute.description ?? "Sem descricao."}</p>
          </div>
          <span className={`status-pill ${participantStatus.className}`}>{participantStatus.label}</span>
        </div>
        <div className="dispute-metrics">
          <Metric label="Valor de entrada" value={formatCurrency(dispute.entryFeeCents / 100)} />
          <Metric label="Jogos" value={games.length} />
          <Metric label="Especiais" value={dispute.includesSpecialPredictions ? "Inclui campeao e artilheiro" : "Sem especiais"} />
          <Metric label="Status da disputa" value={dispute.isActive ? "Ativa" : "Inativa"} />
        </div>
        <div className="participant-dispute-actions">
          <Link className="button secondary" href={`/ranking?disputa=${dispute.slug}`}>
            Ver ranking desta disputa
          </Link>
          {!participantDispute && dispute.isActive ? (
            <form action={joinDispute}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="disputeId" value={dispute.id} />
              <button type="submit">Entrar nesta disputa</button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="stack">
        <h2>Jogos desta disputa</h2>
        {games.length === 0 ? (
          <p className="card muted">Esta disputa ainda nao possui jogos vinculados.</p>
        ) : (
          <>
            <div className="card dispute-games-desktop">
              <table className="dispute-games-table">
                <thead>
                  <tr>
                    <th>Jogo</th>
                    <th>Partida</th>
                    <th>Fase</th>
                    <th>Data e hora</th>
                    <th>Status</th>
                    <th>Placar final</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map(({ game }) => {
                    const status = getGameStatus(game);
                    const gameHasStarted = new Date() >= game.startsAt;

                    return (
                      <tr key={game.id}>
                        <td>#{game.number}</td>
                        <td>
                          <span className="matchup-line">
                            <TeamBadge teamName={game.homeTeam} />
                            <span>x</span>
                            <TeamBadge teamName={game.awayTeam} />
                          </span>
                        </td>
                        <td>{game.stage}{game.groupName ? ` - Grupo ${game.groupName}` : ""}</td>
                        <td>{formatDateTime(game.startsAt)}</td>
                        <td>
                          <span className={`status-pill ${status.className}`}>{status.label}</span>
                          <span className="muted table-detail">{game.status}</span>
                        </td>
                        <td>{formatFinalScore(game)}</td>
                        <td>
                          {gameHasStarted ? (
                            <Link className="button secondary" href={`/participante/${token}/palpites/${game.id}`}>
                              Ver palpites da galera
                            </Link>
                          ) : (
                            <span className="muted compact-text">Palpites liberados no inicio do jogo.</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="dispute-games-mobile stack">
              {games.map(({ game }) => {
                const status = getGameStatus(game);
                const gameHasStarted = new Date() >= game.startsAt;

                return (
                  <article key={game.id} className="card stack dispute-game-card">
                    <div className="section-heading">
                      <strong>Jogo {game.number}</strong>
                      <span className={`status-pill ${status.className}`}>{status.label}</span>
                    </div>
                    <p className="matchup-line">
                      <TeamBadge teamName={game.homeTeam} />
                      <span>x</span>
                      <TeamBadge teamName={game.awayTeam} />
                    </p>
                    <div className="admin-ranking-card-grid">
                      <Metric label="Fase" value={`${game.stage}${game.groupName ? ` - Grupo ${game.groupName}` : ""}`} />
                      <Metric label="Data e hora" value={formatDateTime(game.startsAt)} />
                      <Metric label="Status do jogo" value={game.status} />
                      <Metric label="Placar final" value={formatFinalScore(game)} />
                    </div>
                    {gameHasStarted ? (
                      <Link className="button secondary" href={`/participante/${token}/palpites/${game.id}`}>
                        Ver palpites da galera
                      </Link>
                    ) : (
                      <p className="muted compact-text">Palpites da galera serao liberados quando o jogo comecar.</p>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
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
