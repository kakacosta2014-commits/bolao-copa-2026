import { GameStatus } from "@prisma/client";
import { AdminNav } from "@/components/AdminNav";
import { MessageBanner } from "@/components/MessageBanner";
import { TeamBadge } from "@/components/TeamBadge";
import { deleteGame, importDefaultGames, importGames, upsertGame } from "@/lib/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireAdmin();
  const { ok, erro } = await searchParams;
  const games = await prisma.game.findMany({
    orderBy: { number: "asc" },
    include: { _count: { select: { predictions: true } } }
  });

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <AdminNav />
      <h1>Jogos</h1>
      <MessageBanner ok={ok} erro={erro} />
      <form action={upsertGame} className="card stack">
        <h2>Criar jogo</h2>
        <div className="grid-auto">
          <label>Numero<input name="number" type="number" required /></label>
          <label>Fase<input name="stage" required /></label>
          <label>Grupo<input name="groupName" /></label>
          <label>Time da casa<input name="homeTeam" required /></label>
          <label>Time visitante<input name="awayTeam" required /></label>
          <label>Data e hora<input name="startsAt" type="datetime-local" required /></label>
          <label>
            Status
            <select name="status" defaultValue="AGENDADO">
              {Object.values(GameStatus).map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>
        <button type="submit">Salvar jogo</button>
      </form>

      <form action={importGames} className="card stack">
        <h2>Importacao em massa</h2>
        <p className="muted">
          Formato esperado: <code>numero;fase;grupo;timeCasa;timeVisitante;dataHora</code>
        </p>
        <p className="muted">
          Exemplo: <code>1;Fase de Grupos;A;Brasil;Alemanha;2026-06-11T16:00:00-03:00</code>
        </p>
        <textarea name="csv" rows={5} placeholder="1;Fase de Grupos;A;Brasil;Alemanha;2026-06-11T16:00:00-03:00" />
        <button type="submit">Importar CSV</button>
      </form>

      <form action={importDefaultGames} className="card stack">
        <h2>Tabela padrao</h2>
        <p className="muted">
          Importa o arquivo <code>prisma/data/world-cup-2026-games.csv</code> usando o mesmo formato CSV.
        </p>
        <button type="submit" className="secondary">Importar tabela padrao</button>
      </form>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Jogo</th>
              <th>Fase</th>
              <th>Inicio</th>
              <th>Status</th>
              <th>Editar</th>
              <th>Excluir</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id}>
                <td>{game.number}</td>
                <td>
                  <span className="matchup-line">
                    <TeamBadge teamName={game.homeTeam} />
                    <span>x</span>
                    <TeamBadge teamName={game.awayTeam} />
                  </span>
                </td>
                <td>{game.stage} {game.groupName ? `- ${game.groupName}` : ""}</td>
                <td>{formatDateTime(game.startsAt)}</td>
                <td>{game.status}</td>
                <td>
                  <form action={upsertGame} className="stack">
                    <input type="hidden" name="id" value={game.id} />
                    <input name="number" type="number" defaultValue={game.number} required />
                    <input name="stage" defaultValue={game.stage} required />
                    <input name="groupName" defaultValue={game.groupName ?? ""} />
                    <input name="homeTeam" defaultValue={game.homeTeam} required />
                    <input name="awayTeam" defaultValue={game.awayTeam} required />
                    <input name="startsAt" type="datetime-local" defaultValue={game.startsAt.toISOString().slice(0, 16)} required />
                    <select name="status" defaultValue={game.status}>
                      {Object.values(GameStatus).map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <button type="submit">Atualizar</button>
                  </form>
                </td>
                <td>
                  <form action={deleteGame}>
                    <input type="hidden" name="id" value={game.id} />
                    <button type="submit" className="danger" disabled={game._count.predictions > 0}>Excluir</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
