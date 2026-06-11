import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getTodayRange, isGameToday } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const today = getTodayRange();
  const [todayGames, upcomingGames] = await Promise.all([
    prisma.game.findMany({
      where: {
        startsAt: {
          gte: today.start,
          lt: today.end
        }
      },
      orderBy: { startsAt: "asc" }
    }),
    prisma.game.findMany({
      where: {
        startsAt: {
          gte: today.end
        }
      },
      orderBy: { startsAt: "asc" }
    })
  ]);

  const renderTable = (games: typeof todayGames) => (
    <div className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Jogo</th>
            <th>Fase</th>
            <th>Grupo</th>
            <th>Horário</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id}>
              <td>{game.number}</td>
              <td>{game.homeTeam} x {game.awayTeam}</td>
              <td>{game.stage}</td>
              <td>{game.groupName ?? "-"}</td>
              <td>
                {formatDateTime(game.startsAt)}
                {isGameToday(game.startsAt) ? " - hoje" : ""} - Horário de Brasília
              </td>
              <td>{game.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {games.length === 0 ? <p className="muted">Nenhum jogo nesta seção.</p> : null}
    </div>
  );

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <h1>Jogos da Copa 2026</h1>
      <p className="muted">Tabela pública para conferência. Horários exibidos em horário de Brasília.</p>

      <section className="stack">
        <h2>Jogos de hoje</h2>
        {renderTable(todayGames)}
      </section>

      <section className="stack">
        <h2>Próximos jogos</h2>
        {renderTable(upcomingGames)}
      </section>
    </main>
  );
}
