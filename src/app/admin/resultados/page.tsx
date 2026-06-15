import { AdminNav } from "@/components/AdminNav";
import { MessageBanner } from "@/components/MessageBanner";
import { TeamBadge } from "@/components/TeamBadge";
import { saveResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type ResultGame = Awaited<ReturnType<typeof getGames>>[number];

function hasResult(game: ResultGame) {
  return game.homeScore !== null && game.awayScore !== null;
}

function isFutureGame(game: ResultGame) {
  return new Date() < game.startsAt;
}

async function getGames() {
  return prisma.game.findMany({
    orderBy: [{ startsAt: "asc" }, { number: "asc" }],
    include: { goalScorers: true }
  });
}

function ResultForm({ game }: { game: ResultGame }) {
  const launched = hasResult(game);
  const future = !launched && isFutureGame(game);

  return (
    <form
      key={game.id}
      action={saveResult}
      className={`card stack result-card ${launched ? "result-card-launched" : "result-card-pending"}`}
    >
      <input type="hidden" name="gameId" value={game.id} />
      <div className="result-card-header">
        <div>
          <strong className="matchup-line">
            <span>Jogo {game.number}:</span>
            <TeamBadge teamName={game.homeTeam} />
            <span>x</span>
            <TeamBadge teamName={game.awayTeam} />
          </strong>
          <p className="muted compact-text">{formatDateTime(game.startsAt)}</p>
          <p className="muted compact-text">Status do jogo: {game.status}</p>
        </div>
        <div className="status-row">
          <span className={`status-pill ${launched ? "status-paid" : "status-warning"}`}>
            {launched ? "Resultado lançado" : "Pendente"}
          </span>
          {future ? <span className="status-pill status-ended">Jogo ainda não iniciado</span> : null}
        </div>
      </div>

      {launched ? (
        <p className="result-note result-note-success">Este resultado já foi lançado e o ranking foi recalculado.</p>
      ) : (
        <p className="result-note result-note-pending">Resultado ainda não lançado para este jogo.</p>
      )}

      <div className="grid-auto">
        <label>
          <span className="team-label">Gols <TeamBadge teamName={game.homeTeam} /></span>
          <input name="homeScore" type="number" min="0" defaultValue={game.homeScore ?? 0} required />
        </label>
        <label>
          <span className="team-label">Gols <TeamBadge teamName={game.awayTeam} /></span>
          <input name="awayScore" type="number" min="0" defaultValue={game.awayScore ?? 0} required />
        </label>
      </div>
      <label>
        Jogadores que fizeram gol
        <span className="muted table-detail">
          Digite um jogador por linha. Para aceitar variações do mesmo jogador, use |.
          Ex: Vinícius Júnior | Vini Jr | Vini | Vinicius Junior
        </span>
        <textarea
          name="goalScorers"
          rows={3}
          defaultValue={game.goalScorers.map((scorer) => scorer.playerName).join("\n")}
          placeholder={"Vinícius Júnior | Vini Jr | Vini\nRodrygo | Rodrygo Goes"}
        />
      </label>
      <button type="submit">
        {launched ? "Atualizar resultado e recalcular" : "Salvar resultado e recalcular"}
      </button>
    </form>
  );
}

export default async function AdminResultsPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireAdmin();
  const { ok, erro } = await searchParams;
  const games = await getGames();
  const launchedGames = games.filter(hasResult);
  const pendingGames = games.filter((game) => !hasResult(game));

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <AdminNav />
      <h1>Resultados</h1>
      <MessageBanner ok={ok} erro={erro} />

      <section className="result-summary-grid">
        <div className="card result-summary-card">
          <span className="muted">Total de jogos listados</span>
          <strong>{games.length}</strong>
        </div>
        <div className="card result-summary-card">
          <span className="muted">Resultados lançados</span>
          <strong>{launchedGames.length}</strong>
        </div>
        <div className="card result-summary-card">
          <span className="muted">Resultados pendentes</span>
          <strong>{pendingGames.length}</strong>
        </div>
      </section>

      <section className="stack">
        <div className="section-heading">
          <h2>Resultados pendentes</h2>
          <span className="status-pill status-warning">{pendingGames.length} pendentes</span>
        </div>
        {pendingGames.length === 0 ? (
          <p className="card muted">Todos os resultados disponíveis já foram lançados.</p>
        ) : (
          pendingGames.map((game) => <ResultForm key={game.id} game={game} />)
        )}
      </section>

      <section className="stack">
        <div className="section-heading">
          <h2>Resultados lançados</h2>
          <span className="status-pill status-paid">{launchedGames.length} lançados</span>
        </div>
        {launchedGames.length === 0 ? (
          <p className="card muted">Nenhum resultado lançado ainda.</p>
        ) : (
          launchedGames.map((game) => <ResultForm key={game.id} game={game} />)
        )}
      </section>

      {games.length === 0 ? <p className="muted">Cadastre jogos antes de lançar resultados.</p> : null}
    </main>
  );
}
