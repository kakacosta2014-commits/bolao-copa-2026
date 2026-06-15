import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/format";
import { DISPUTE_RANKING_OPTIONS, getDisputeRankingData } from "@/lib/ranking";

export const dynamic = "force-dynamic";

type SearchParams = {
  disputa?: string;
};

function disputeHref(slug: string) {
  return slug === "geral" ? "/ranking" : `/ranking?disputa=${slug}`;
}

export default async function RankingPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const data = await getDisputeRankingData(params.disputa ?? "geral");

  if (!data) {
    return (
      <main className="container stack" style={{ padding: "2rem 0" }}>
        <h1>Ranking</h1>
        <p className="muted">Disputa nao encontrada.</p>
      </main>
    );
  }

  const { dispute, ranking, prizes, selectedSlug, summary } = data;

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <h1>Ranking</h1>
      <nav className="dispute-tabs" aria-label="Escolher disputa">
        {DISPUTE_RANKING_OPTIONS.map((option) => (
          <a
            key={option.slug}
            className={`button ${selectedSlug === option.slug ? "" : "secondary"}`}
            href={disputeHref(option.slug)}
          >
            {option.label}
          </a>
        ))}
      </nav>

      <section className="stack">
        <div>
          <h2>{dispute.name}</h2>
          <p className="muted compact-text">
            {summary.includesSpecialPredictions
              ? "Inclui pontos de campeao e artilheiro."
              : "Ranking somente com os jogos desta disputa."}
          </p>
        </div>

        <div className="grid-auto">
          <StatCard label="Jogos da disputa" value={summary.totalGames} />
          <StatCard label="Participantes pagos" value={summary.paidParticipants} />
          <StatCard label="Total arrecadado" value={formatCurrency(prizes.total)} />
          <StatCard label={`Organizador ${prizes.percentages.organizerPrizePercent}%`} value={formatCurrency(prizes.organizer)} />
          <StatCard label={`1o lugar ${prizes.percentages.firstPrizePercent}%`} value={formatCurrency(prizes.firstPlace)} />
          <StatCard label={`2o lugar ${prizes.percentages.secondPrizePercent}%`} value={formatCurrency(prizes.secondPlace)} />
          <StatCard label={`3o lugar ${prizes.percentages.thirdPrizePercent}%`} value={formatCurrency(prizes.thirdPlace)} />
        </div>
      </section>

      {summary.totalGames === 0 ? (
        <p className="warning-text">Esta disputa ainda nao possui jogos vinculados.</p>
      ) : null}
      {summary.paidParticipants === 0 ? (
        <p className="muted">Ainda nao ha participantes pagos nesta disputa.</p>
      ) : null}

      <div className="card table-wrap ranking-desktop">
        <table>
          <thead>
            <tr>
              <th>Posicao</th>
              <th>Participante</th>
              <th>Jogos</th>
              {summary.includesSpecialPredictions ? <th>Campeao</th> : null}
              {summary.includesSpecialPredictions ? <th>Artilheiro</th> : null}
              <th>Total</th>
              <th>Exatos</th>
              <th>Resultados</th>
              <th>Jogadores-gol</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((participant) => (
              <tr key={participant.id}>
                <td>{participant.position ? `${participant.position}o` : "-"}</td>
                <td>{participant.name}</td>
                <td>{participant.gamePoints}</td>
                {summary.includesSpecialPredictions ? <td>{participant.championPoints}</td> : null}
                {summary.includesSpecialPredictions ? <td>{participant.topScorerPoints}</td> : null}
                <td><strong>{participant.totalPoints}</strong></td>
                <td>{participant.exactScores}</td>
                <td>{participant.correctResults}</td>
                <td>{participant.goalScorers}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ranking.length === 0 ? <p className="muted">Nenhum participante pago ainda.</p> : null}
      </div>

      <section className="ranking-mobile stack">
        {ranking.map((participant) => (
          <article key={participant.id} className="card stack">
            <div className="section-heading">
              <strong>{participant.name}</strong>
              <span className="status-pill">{participant.position ? `${participant.position}o` : "-"}</span>
            </div>
            <div className="admin-ranking-card-grid">
              <Metric label="Pontos" value={participant.totalPoints} />
              <Metric label="Jogos" value={participant.gamePoints} />
              {summary.includesSpecialPredictions ? <Metric label="Campeao" value={participant.championPoints} /> : null}
              {summary.includesSpecialPredictions ? <Metric label="Artilheiro" value={participant.topScorerPoints} /> : null}
              <Metric label="Exatos" value={participant.exactScores} />
              <Metric label="Resultados" value={participant.correctResults} />
              <Metric label="Jogador-gol" value={participant.goalScorers} />
            </div>
          </article>
        ))}
        {ranking.length === 0 ? <p className="muted">Nenhum participante pago ainda.</p> : null}
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
