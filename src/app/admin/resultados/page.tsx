import { AdminNav } from "@/components/AdminNav";
import { MessageBanner } from "@/components/MessageBanner";
import { saveResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireAdmin();
  const { ok, erro } = await searchParams;
  const games = await prisma.game.findMany({
    orderBy: { number: "asc" },
    include: { goalScorers: true }
  });

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <AdminNav />
      <h1>Resultados</h1>
      <MessageBanner ok={ok} erro={erro} />
      <div className="stack">
        {games.map((game) => (
          <form key={game.id} action={saveResult} className="card stack">
            <input type="hidden" name="gameId" value={game.id} />
            <div>
              <strong>Jogo {game.number}: {game.homeTeam} x {game.awayTeam}</strong>
              <p className="muted">{formatDateTime(game.startsAt)}</p>
            </div>
            <div className="grid-auto">
              <label>
                Gols {game.homeTeam}
                <input name="homeScore" type="number" min="0" defaultValue={game.homeScore ?? 0} required />
              </label>
              <label>
                Gols {game.awayTeam}
                <input name="awayScore" type="number" min="0" defaultValue={game.awayScore ?? 0} required />
              </label>
            </div>
            <label>
              Jogadores que fizeram gol
              <textarea
                name="goalScorers"
                rows={3}
                defaultValue={game.goalScorers.map((scorer) => scorer.playerName).join("\n")}
                placeholder="Um nome por linha ou separados por virgula"
              />
            </label>
            <button type="submit">Salvar resultado e recalcular</button>
          </form>
        ))}
        {games.length === 0 ? <p className="muted">Cadastre jogos antes de lancar resultados.</p> : null}
      </div>
    </main>
  );
}
