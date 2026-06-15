import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/admin";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  DISPUTE_RANKING_OPTIONS,
  getDisputeRankingData,
  type DisputeRankingStatusFilter
} from "@/lib/ranking";

export const dynamic = "force-dynamic";

type SearchParams = {
  disputa?: string;
  status?: string;
  q?: string;
};

function getPositionBadge(position: number | null) {
  if (position === 1) return "1o";
  if (position === 2) return "2o";
  if (position === 3) return "3o";
  return position ? `${position}o` : "-";
}

function normalizeSearch(value?: string) {
  return String(value ?? "").trim().toLowerCase();
}

function getParticipationPercent(predictions: number, totalGames: number) {
  if (totalGames === 0) return "0%";
  return `${((predictions / totalGames) * 100).toFixed(1).replace(".", ",")}%`;
}

function adminDisputeHref(slug: string) {
  return slug === "geral" ? "/admin/ranking" : `/admin/ranking?disputa=${slug}`;
}

function toStatusFilter(value?: string): DisputeRankingStatusFilter {
  if (value === "todos") return "all";
  if (value === "pendente") return "pending";
  return "paid";
}

export default async function AdminRankingPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const filters = await searchParams;
  const statusFilter = toStatusFilter(filters.status);
  const query = normalizeSearch(filters.q);
  const data = await getDisputeRankingData(filters.disputa ?? "geral", statusFilter);

  if (!data) {
    return (
      <main className="container stack" style={{ padding: "2rem 0" }}>
        <AdminNav />
        <h1>Ranking administrativo</h1>
        <p className="muted">Disputa nao encontrada.</p>
      </main>
    );
  }

  const { dispute, ranking, prizes, selectedSlug, summary } = data;
  const leader = ranking.find((participant) => participant.position === 1);
  const filteredParticipants = ranking.filter((participant) => {
    if (!query) return true;

    return (
      participant.name.toLowerCase().includes(query) ||
      participant.whatsapp.toLowerCase().includes(query)
    );
  });

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <AdminNav />
      <h1>Ranking administrativo</h1>
      <p className="muted">
        Ranking por disputa. Participantes pendentes nao entram na classificacao da disputa.
      </p>

      <nav className="dispute-tabs" aria-label="Escolher disputa">
        {DISPUTE_RANKING_OPTIONS.map((option) => (
          <a
            key={option.slug}
            className={`button ${selectedSlug === option.slug ? "" : "secondary"}`}
            href={adminDisputeHref(option.slug)}
          >
            {option.label}
          </a>
        ))}
      </nav>

      <section className="admin-ranking-summary">
        <SummaryCard label="Disputa" value={dispute.name} />
        <SummaryCard label="Participantes pagos" value={summary.paidParticipants} />
        <SummaryCard label="Participantes pendentes" value={summary.pendingParticipants} />
        <SummaryCard label="Jogos da disputa" value={summary.totalGames} />
        <SummaryCard label="Arrecadado estimado" value={formatCurrency(prizes.total)} />
        <SummaryCard label="Organizador 20%" value={formatCurrency(prizes.organizer)} />
        <SummaryCard label="1o lugar 40%" value={formatCurrency(prizes.firstPlace)} />
        <SummaryCard label="2o lugar 25%" value={formatCurrency(prizes.secondPlace)} />
        <SummaryCard label="3o lugar 15%" value={formatCurrency(prizes.thirdPlace)} />
        <SummaryCard label="Especiais" value={summary.includesSpecialPredictions ? "Inclui" : "Nao inclui"} />
        <SummaryCard label="Lider atual" value={leader?.name ?? "Sem lider ainda"} />
        <SummaryCard label="Pontos do lider" value={leader?.totalPoints ?? 0} />
      </section>

      {summary.totalGames === 0 ? (
        <p className="warning-text">Esta disputa ainda nao possui jogos vinculados.</p>
      ) : null}
      {summary.paidParticipants === 0 ? (
        <p className="muted">Ainda nao ha participantes pagos nesta disputa.</p>
      ) : null}

      <form className="card ranking-filters" method="get">
        <input type="hidden" name="disputa" value={selectedSlug} />
        <label>
          Buscar participante
          <input name="q" defaultValue={filters.q ?? ""} placeholder="Nome ou WhatsApp" />
        </label>
        <label>
          Status de pagamento na disputa
          <select name="status" defaultValue={filters.status ?? "pago"}>
            <option value="pago">Pagos</option>
            <option value="pendente">Pendentes</option>
            <option value="todos">Todos</option>
          </select>
        </label>
        <div className="filter-actions">
          <button type="submit">Filtrar</button>
          <a className="button secondary" href={adminDisputeHref(selectedSlug)}>Limpar</a>
        </div>
      </form>

      <section className="stack">
        <h2>Classificacao - {dispute.name}</h2>
        <div className="card admin-ranking-desktop">
          <table className="admin-ranking-table">
            <thead>
              <tr>
                <th>Posicao</th>
                <th>Participante</th>
                <th>WhatsApp</th>
                <th>Status</th>
                <th>Pontos</th>
                <th>Palpites</th>
                <th>Participacao</th>
                <th>Especiais</th>
                <th>Acertos</th>
                <th>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((participant) => (
                <tr key={participant.id} className={participant.position && participant.position <= 3 ? "ranking-top-row" : ""}>
                  <td><span className="status-pill">{getPositionBadge(participant.position)}</span></td>
                  <td><strong>{participant.name}</strong></td>
                  <td>{participant.whatsapp || "-"}</td>
                  <td>
                    <span className={`status-pill ${participant.paymentStatus === "PAID" ? "status-paid" : "status-pending"}`}>
                      {participant.paymentStatus === "PAID" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td><strong>{participant.totalPoints}</strong></td>
                  <td>{participant.predictionCount} / {summary.totalGames}</td>
                  <td>{getParticipationPercent(participant.predictionCount, summary.totalGames)}</td>
                  <td>
                    {summary.includesSpecialPredictions
                      ? participant.specialsComplete ? "Completo" : "Incompleto"
                      : "Nao se aplica"}
                  </td>
                  <td>
                    <span className="table-detail">Exatos: {participant.exactScores}</span>
                    <span className="table-detail">Resultados: {participant.correctResults}</span>
                    <span className="table-detail">Jogador-gol: {participant.goalScorers}</span>
                  </td>
                  <td>{formatDateTime(participant.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredParticipants.length === 0 ? <p className="muted">Nenhum participante encontrado.</p> : null}
        </div>

        <div className="admin-ranking-mobile stack">
          {filteredParticipants.map((participant) => (
            <article key={participant.id} className={`card stack ${participant.position && participant.position <= 3 ? "ranking-top-card" : ""}`}>
              <div className="section-heading">
                <div>
                  <strong>{participant.name}</strong>
                  <span className="muted table-detail">{participant.whatsapp || "WhatsApp nao informado"}</span>
                </div>
                <span className="status-pill">{getPositionBadge(participant.position)}</span>
              </div>
              <div className="status-row">
                <span className={`status-pill ${participant.paymentStatus === "PAID" ? "status-paid" : "status-pending"}`}>
                  {participant.paymentStatus === "PAID" ? "Pago" : "Pendente"}
                </span>
                <span className="status-pill">
                  {summary.includesSpecialPredictions
                    ? participant.specialsComplete ? "Especiais completos" : "Especiais incompletos"
                    : "Sem especiais"}
                </span>
              </div>
              <div className="admin-ranking-card-grid">
                <Metric label="Pontos" value={participant.totalPoints} />
                <Metric label="Palpites" value={`${participant.predictionCount} / ${summary.totalGames}`} />
                <Metric label="Participacao" value={getParticipationPercent(participant.predictionCount, summary.totalGames)} />
                <Metric label="Exatos" value={participant.exactScores} />
                <Metric label="Resultados" value={participant.correctResults} />
                <Metric label="Jogador-gol" value={participant.goalScorers} />
              </div>
              <p className="muted compact-text">Cadastro: {formatDateTime(participant.createdAt)}</p>
            </article>
          ))}
          {filteredParticipants.length === 0 ? <p className="muted">Nenhum participante encontrado.</p> : null}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card admin-ranking-summary-card">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({ label, value }: { label: string | number; value: string | number }) {
  return (
    <div>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
