import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getRankingData } from "@/lib/ranking";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  q?: string;
};

function getPositionBadge(position: number) {
  if (position === 1) return "🥇 1º";
  if (position === 2) return "🥈 2º";
  if (position === 3) return "🥉 3º";
  return `${position}º`;
}

function normalizeSearch(value?: string) {
  return String(value ?? "").trim().toLowerCase();
}

function getParticipationPercent(predictions: number, totalGames: number) {
  if (totalGames === 0) return "0%";
  return `${((predictions / totalGames) * 100).toFixed(1).replace(".", ",")}%`;
}

export default async function AdminRankingPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const filters = await searchParams;
  const statusFilter = filters.status === "pago" || filters.status === "pendente" ? filters.status : "";
  const query = normalizeSearch(filters.q);

  const [{ ranking }, participants, totalGames, gamesWithResult, paidParticipants, pendingParticipants] = await Promise.all([
    getRankingData(),
    prisma.participant.findMany({
      include: {
        predictions: true,
        specialPrediction: true
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.game.count(),
    prisma.game.count({
      where: {
        homeScore: { not: null },
        awayScore: { not: null }
      }
    }),
    prisma.participant.count({ where: { paid: true } }),
    prisma.participant.count({ where: { paid: false } })
  ]);

  const rankingByParticipantId = new Map(ranking.map((item, index) => [item.id, { ...item, position: index + 1 }]));
  const enrichedParticipants = participants
    .map((participant) => {
      const rankingItem = rankingByParticipantId.get(participant.id);
      const predictionCount = participant.predictions.length;
      const specialsComplete = Boolean(
        participant.specialPrediction?.championTeam && participant.specialPrediction?.topScorerPlayer
      );

      return {
        id: participant.id,
        name: participant.name,
        whatsapp: participant.whatsapp,
        paid: participant.paid,
        createdAt: participant.createdAt,
        predictionCount,
        specialsComplete,
        position: rankingItem?.position ?? null,
        totalPoints: rankingItem?.totalPoints ?? 0,
        exactScores: rankingItem?.exactScores ?? 0,
        correctResults: rankingItem?.correctResults ?? 0,
        goalScorers: rankingItem?.goalScorers ?? 0
      };
    })
    .sort((a, b) => {
      if (a.position && b.position) return a.position - b.position;
      if (a.position) return -1;
      if (b.position) return 1;
      return a.name.localeCompare(b.name);
    });

  const filteredParticipants = enrichedParticipants.filter((participant) => {
    if (statusFilter === "pago" && !participant.paid) return false;
    if (statusFilter === "pendente" && participant.paid) return false;
    if (!query) return true;

    return (
      participant.name.toLowerCase().includes(query) ||
      participant.whatsapp.toLowerCase().includes(query)
    );
  });

  const leader = ranking[0];

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <AdminNav />
      <h1>Ranking administrativo</h1>
      <p className="muted">Visão administrativa do Bolão Geral atual. O ranking público continua usando a mesma lógica.</p>

      <section className="admin-ranking-summary">
        <SummaryCard label="Participantes pagos" value={paidParticipants} />
        <SummaryCard label="Participantes pendentes" value={pendingParticipants} />
        <SummaryCard label="Jogos com resultado" value={gamesWithResult} />
        <SummaryCard label="Total de jogos" value={totalGames} />
        <SummaryCard label="Líder atual" value={leader?.name ?? "Sem líder ainda"} />
        <SummaryCard label="Pontos do líder" value={leader?.totalPoints ?? 0} />
      </section>

      <form className="card ranking-filters" method="get">
        <label>
          Buscar participante
          <input name="q" defaultValue={filters.q ?? ""} placeholder="Nome ou WhatsApp" />
        </label>
        <label>
          Status de pagamento
          <select name="status" defaultValue={statusFilter}>
            <option value="">Todos</option>
            <option value="pago">Pagos</option>
            <option value="pendente">Pendentes</option>
          </select>
        </label>
        <div className="filter-actions">
          <button type="submit">Filtrar</button>
          <a className="button secondary" href="/admin/ranking">Limpar</a>
        </div>
      </form>

      <section className="stack">
        <h2>Classificação geral</h2>
        <div className="card admin-ranking-desktop">
          <table className="admin-ranking-table">
            <thead>
              <tr>
                <th>Posição</th>
                <th>Participante</th>
                <th>WhatsApp</th>
                <th>Status</th>
                <th>Pontos</th>
                <th>Palpites</th>
                <th>Participação</th>
                <th>Especiais</th>
                <th>Acertos</th>
                <th>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((participant) => (
                <tr key={participant.id} className={participant.position && participant.position <= 3 ? "ranking-top-row" : ""}>
                  <td><span className="status-pill">{participant.position ? getPositionBadge(participant.position) : "-"}</span></td>
                  <td><strong>{participant.name}</strong></td>
                  <td>{participant.whatsapp || "-"}</td>
                  <td>
                    <span className={`status-pill ${participant.paid ? "status-paid" : "status-pending"}`}>
                      {participant.paid ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td><strong>{participant.totalPoints}</strong></td>
                  <td>{participant.predictionCount} / {totalGames}</td>
                  <td>{getParticipationPercent(participant.predictionCount, totalGames)}</td>
                  <td>{participant.specialsComplete ? "Completo" : "Incompleto"}</td>
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
                  <span className="muted table-detail">{participant.whatsapp || "WhatsApp não informado"}</span>
                </div>
                <span className="status-pill">{participant.position ? getPositionBadge(participant.position) : "-"}</span>
              </div>
              <div className="status-row">
                <span className={`status-pill ${participant.paid ? "status-paid" : "status-pending"}`}>
                  {participant.paid ? "Pago" : "Pendente"}
                </span>
                <span className="status-pill">{participant.specialsComplete ? "Especiais completos" : "Especiais incompletos"}</span>
              </div>
              <div className="admin-ranking-card-grid">
                <Metric label="Pontos" value={participant.totalPoints} />
                <Metric label="Palpites" value={`${participant.predictionCount} / ${totalGames}`} />
                <Metric label="Participação" value={getParticipationPercent(participant.predictionCount, totalGames)} />
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
