import { GameStatus, Prisma } from "@prisma/client";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const gameStatuses = Object.values(GameStatus);

type SearchParams = {
  participant?: string;
  gameNumber?: string;
  gameStatus?: string;
  paymentStatus?: string;
  today?: string;
  blocked?: string;
};

function text(value?: string) {
  return String(value ?? "").trim();
}

function parseGameNumber(value?: string) {
  const parsed = Number.parseInt(text(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getSaoPauloDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric"
  }).formatToParts(date);

  return {
    day: Number(parts.find((part) => part.type === "day")?.value ?? "1"),
    month: Number(parts.find((part) => part.type === "month")?.value ?? "1"),
    year: Number(parts.find((part) => part.type === "year")?.value ?? "1970")
  };
}

function getSaoPauloDayRange(date: Date) {
  const { day, month, year } = getSaoPauloDateParts(date);
  const saoPauloOffsetHours = 3;
  const start = new Date(Date.UTC(year, month - 1, day, saoPauloOffsetHours, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function getGameTiming(game: { startsAt: Date; status: GameStatus }) {
  if (game.status === "ENCERRADO") return { label: "Encerrado", className: "status-ended" };
  if (new Date() >= game.startsAt) return { label: "Bloqueado", className: "status-blocked" };
  return { label: "Aberto", className: "status-open" };
}

function getPaymentStatus(paid: boolean) {
  return paid
    ? { label: "Pago", className: "status-paid" }
    : { label: "Pendente", className: "status-pending" };
}

function buildPredictionWhere(filters: SearchParams) {
  const participant = text(filters.participant);
  const gameNumber = parseGameNumber(filters.gameNumber);
  const gameStatus = gameStatuses.includes(filters.gameStatus as GameStatus) ? (filters.gameStatus as GameStatus) : null;
  const paymentStatus = filters.paymentStatus === "paid" || filters.paymentStatus === "pending" ? filters.paymentStatus : "";
  const now = new Date();
  const todayRange = filters.today === "on" ? getSaoPauloDayRange(now) : null;

  const where: Prisma.PredictionWhereInput = {};

  if (participant || paymentStatus) {
    where.participant = {};
    if (participant) {
      where.participant.OR = [
        { name: { contains: participant, mode: "insensitive" } },
        { whatsapp: { contains: participant, mode: "insensitive" } }
      ];
    }
    if (paymentStatus) where.participant.paid = paymentStatus === "paid";
  }

  if (gameNumber || gameStatus || todayRange || filters.blocked === "on") {
    where.game = {};
    if (gameNumber) where.game.number = gameNumber;
    if (gameStatus) where.game.status = gameStatus;
    if (todayRange) {
      where.game.startsAt = {
        gte: todayRange.start,
        lt: todayRange.end
      };
    }
    if (filters.blocked === "on") {
      where.game.startsAt = {
        ...(typeof where.game.startsAt === "object" && where.game.startsAt ? where.game.startsAt : {}),
        lte: now
      };
    }
  }

  return where;
}

function buildSpecialWhere(filters: SearchParams) {
  const participant = text(filters.participant);
  const paymentStatus = filters.paymentStatus === "paid" || filters.paymentStatus === "pending" ? filters.paymentStatus : "";
  const where: Prisma.SpecialPredictionWhereInput = {};

  if (participant || paymentStatus) {
    where.participant = {};
    if (participant) {
      where.participant.OR = [
        { name: { contains: participant, mode: "insensitive" } },
        { whatsapp: { contains: participant, mode: "insensitive" } }
      ];
    }
    if (paymentStatus) where.participant.paid = paymentStatus === "paid";
  }

  return where;
}

export default async function AdminPredictionsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const filters = await searchParams;
  const where = buildPredictionWhere(filters);
  const specialWhere = buildSpecialWhere(filters);

  const [predictions, specialPredictions] = await Promise.all([
    prisma.prediction.findMany({
      where,
      include: {
        game: true,
        participant: true
      },
      orderBy: [
        { game: { number: "asc" } },
        { participant: { name: "asc" } }
      ]
    }),
    prisma.specialPrediction.findMany({
      where: specialWhere,
      include: { participant: true },
      orderBy: { participant: { name: "asc" } }
    })
  ]);

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <AdminNav />
      <h1>Palpites</h1>

      <form className="card predictions-filters" method="get">
        <label>
          Participante ou WhatsApp
          <input name="participant" defaultValue={filters.participant ?? ""} placeholder="Nome ou WhatsApp" />
        </label>
        <label>
          Numero do jogo
          <input name="gameNumber" type="number" min="1" defaultValue={filters.gameNumber ?? ""} />
        </label>
        <label>
          Status do jogo
          <select name="gameStatus" defaultValue={filters.gameStatus ?? ""}>
            <option value="">Todos</option>
            {gameStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Pagamento
          <select name="paymentStatus" defaultValue={filters.paymentStatus ?? ""}>
            <option value="">Todos</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
          </select>
        </label>
        <label className="inline-filter">
          <input name="today" type="checkbox" defaultChecked={filters.today === "on"} />
          Jogos de hoje
        </label>
        <label className="inline-filter">
          <input name="blocked" type="checkbox" defaultChecked={filters.blocked === "on"} />
          Jogos ja bloqueados
        </label>
        <div className="filter-actions">
          <button type="submit">Filtrar</button>
          <a className="button secondary" href="/admin/palpites">Limpar</a>
        </div>
      </form>

      <section className="stack">
        <h2>Palpites dos jogos</h2>
        <div className="card predictions-desktop">
          <table className="predictions-table">
            <thead>
              <tr>
                <th>Participante</th>
                <th>Pagamento</th>
                <th>Jogo</th>
                <th>Horario</th>
                <th>Status</th>
                <th>Palpite</th>
                <th>Gol</th>
                <th>Pontos</th>
                <th>Atualizacao</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((prediction) => {
                const payment = getPaymentStatus(prediction.participant.paid);
                const timing = getGameTiming(prediction.game);

                return (
                  <tr key={prediction.id}>
                    <td>
                      <strong>{prediction.participant.name}</strong>
                      <span className="muted table-detail">{prediction.participant.whatsapp}</span>
                    </td>
                    <td><span className={`status-pill ${payment.className}`}>{payment.label}</span></td>
                    <td>
                      <strong>#{prediction.game.number} {prediction.game.homeTeam} x {prediction.game.awayTeam}</strong>
                      <span className="muted table-detail">
                        {prediction.game.stage}{prediction.game.groupName ? ` - Grupo ${prediction.game.groupName}` : ""}
                      </span>
                    </td>
                    <td>{formatDateTime(prediction.game.startsAt)}</td>
                    <td>
                      <span className={`status-pill ${timing.className}`}>{timing.label}</span>
                      <span className="muted table-detail">{prediction.game.status}</span>
                    </td>
                    <td>{prediction.predictedHomeScore} x {prediction.predictedAwayScore}</td>
                    <td>{prediction.predictedGoalScorer ?? "-"}</td>
                    <td>
                      <strong>{prediction.totalPoints}</strong>
                      <span className="muted table-detail">
                        Placar {prediction.scorePoints} | Resultado {prediction.resultPoints} | Gol {prediction.goalScorerPoints}
                      </span>
                    </td>
                    <td>
                      <span>{formatDateTime(prediction.updatedAt)}</span>
                      <span className="muted table-detail">Criado {formatDateTime(prediction.createdAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {predictions.length === 0 ? <p className="muted">Nenhum palpite encontrado.</p> : null}
        </div>

        <div className="predictions-mobile stack">
          {predictions.map((prediction) => {
            const payment = getPaymentStatus(prediction.participant.paid);
            const timing = getGameTiming(prediction.game);

            return (
              <article key={prediction.id} className="card prediction-card">
                <div>
                  <span className="muted">Participante</span>
                  <strong>{prediction.participant.name}</strong>
                  <span>{prediction.participant.whatsapp}</span>
                </div>
                <div className="status-row">
                  <span className={`status-pill ${payment.className}`}>{payment.label}</span>
                  <span className={`status-pill ${timing.className}`}>{timing.label}</span>
                  <span className="status-pill">{prediction.game.status}</span>
                </div>
                <div>
                  <span className="muted">Jogo</span>
                  <strong>#{prediction.game.number} {prediction.game.homeTeam} x {prediction.game.awayTeam}</strong>
                  <span>{prediction.game.stage}{prediction.game.groupName ? ` - Grupo ${prediction.game.groupName}` : ""}</span>
                </div>
                <div>
                  <span className="muted">Horario</span>
                  <strong>{formatDateTime(prediction.game.startsAt)}</strong>
                </div>
                <div className="prediction-card-grid">
                  <div>
                    <span className="muted">Palpite</span>
                    <strong>{prediction.predictedHomeScore} x {prediction.predictedAwayScore}</strong>
                  </div>
                  <div>
                    <span className="muted">Jogador-gol</span>
                    <strong>{prediction.predictedGoalScorer ?? "-"}</strong>
                  </div>
                  <div>
                    <span className="muted">Placar</span>
                    <strong>{prediction.scorePoints}</strong>
                  </div>
                  <div>
                    <span className="muted">Resultado</span>
                    <strong>{prediction.resultPoints}</strong>
                  </div>
                  <div>
                    <span className="muted">Jogador-gol</span>
                    <strong>{prediction.goalScorerPoints}</strong>
                  </div>
                  <div>
                    <span className="muted">Total</span>
                    <strong>{prediction.totalPoints}</strong>
                  </div>
                </div>
                <div>
                  <span className="muted">Criado / atualizado</span>
                  <strong>{formatDateTime(prediction.createdAt)} / {formatDateTime(prediction.updatedAt)}</strong>
                </div>
              </article>
            );
          })}
          {predictions.length === 0 ? <p className="muted">Nenhum palpite encontrado.</p> : null}
        </div>
      </section>

      <section className="stack">
        <h2>Palpites especiais</h2>
        <div className="card predictions-desktop">
          <table className="special-predictions-table">
            <thead>
              <tr>
                <th>Participante</th>
                <th>Pagamento</th>
                <th>Campeao escolhido</th>
                <th>Artilheiro escolhido</th>
                <th>Pontos campeao</th>
                <th>Pontos artilheiro</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {specialPredictions.map((prediction) => {
                const payment = getPaymentStatus(prediction.participant.paid);

                return (
                  <tr key={prediction.id}>
                    <td>
                      <strong>{prediction.participant.name}</strong>
                      <span className="muted table-detail">{prediction.participant.whatsapp}</span>
                    </td>
                    <td><span className={`status-pill ${payment.className}`}>{payment.label}</span></td>
                    <td>{prediction.championTeam}</td>
                    <td>{prediction.topScorerPlayer}</td>
                    <td>{prediction.championPoints}</td>
                    <td>{prediction.topScorerPoints}</td>
                    <td><strong>{prediction.totalPoints}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {specialPredictions.length === 0 ? <p className="muted">Nenhum palpite especial encontrado.</p> : null}
        </div>

        <div className="predictions-mobile stack">
          {specialPredictions.map((prediction) => {
            const payment = getPaymentStatus(prediction.participant.paid);

            return (
              <article key={prediction.id} className="card prediction-card">
                <div>
                  <span className="muted">Participante</span>
                  <strong>{prediction.participant.name}</strong>
                  <span>{prediction.participant.whatsapp}</span>
                </div>
                <div className="status-row">
                  <span className={`status-pill ${payment.className}`}>{payment.label}</span>
                </div>
                <div>
                  <span className="muted">Campeao escolhido</span>
                  <strong>{prediction.championTeam}</strong>
                </div>
                <div>
                  <span className="muted">Artilheiro escolhido</span>
                  <strong>{prediction.topScorerPlayer}</strong>
                </div>
                <div className="prediction-card-grid">
                  <div>
                    <span className="muted">Pontos campeao</span>
                    <strong>{prediction.championPoints}</strong>
                  </div>
                  <div>
                    <span className="muted">Pontos artilheiro</span>
                    <strong>{prediction.topScorerPoints}</strong>
                  </div>
                  <div>
                    <span className="muted">Total</span>
                    <strong>{prediction.totalPoints}</strong>
                  </div>
                </div>
              </article>
            );
          })}
          {specialPredictions.length === 0 ? <p className="muted">Nenhum palpite especial encontrado.</p> : null}
        </div>
      </section>
    </main>
  );
}
