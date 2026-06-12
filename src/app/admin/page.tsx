import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { MessageBanner } from "@/components/MessageBanner";
import { StatCard } from "@/components/StatCard";
import { TeamBadge } from "@/components/TeamBadge";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { getTodayRange } from "@/lib/games";
import { getRankingData } from "@/lib/ranking";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireAdmin();
  const { ok, erro } = await searchParams;
  const today = getTodayRange();
  const [participants, paid, games, finishedGames, todayGames, { prizes }] = await Promise.all([
    prisma.participant.count(),
    prisma.participant.count({ where: { paid: true } }),
    prisma.game.count(),
    prisma.game.count({ where: { homeScore: { not: null }, awayScore: { not: null } } }),
    prisma.game.findMany({
      where: {
        startsAt: {
          gte: today.start,
          lt: today.end
        }
      },
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { predictions: true } } }
    }),
    getRankingData()
  ]);

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <AdminNav />
      <h1>Dashboard administrativo</h1>
      <MessageBanner ok={ok} erro={erro} />
      <div className="grid-auto">
        <StatCard label="Participantes cadastrados" value={participants} />
        <StatCard label="Participantes pagos" value={paid} />
        <StatCard label="Total arrecadado" value={formatCurrency(prizes.total)} />
        <StatCard label="Organizador" value={formatCurrency(prizes.organizer)} />
        <StatCard label="Premio 1o" value={formatCurrency(prizes.firstPlace)} />
        <StatCard label="Premio 2o" value={formatCurrency(prizes.secondPlace)} />
        <StatCard label="Premio 3o" value={formatCurrency(prizes.thirdPlace)} />
        <StatCard label="Jogos cadastrados" value={games} />
        <StatCard label="Jogos com resultado" value={finishedGames} />
        <StatCard label="Jogos pendentes" value={games - finishedGames} />
      </div>
      <div className="grid-auto">
        <Link className="button" href="/admin/participantes">Gerenciar participantes</Link>
        <Link className="button" href="/admin/jogos">Gerenciar jogos</Link>
        <Link className="button" href="/admin/resultados">Lancar resultados</Link>
        <Link className="button" href="/admin/especiais">Palpites especiais</Link>
      </div>
      <section className="card stack">
        <h2>Jogos de hoje</h2>
        <p className="muted">Horários exibidos em horário de Brasília.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Jogo</th>
                <th>Fase</th>
                <th>Grupo</th>
                <th>Horário</th>
                <th>Status</th>
                <th>Palpites</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {todayGames.map((game) => (
                <tr key={game.id}>
                  <td>{game.number}</td>
                  <td>
                    <span className="matchup-line">
                      <TeamBadge teamName={game.homeTeam} />
                      <span>x</span>
                      <TeamBadge teamName={game.awayTeam} />
                    </span>
                  </td>
                  <td>{game.stage}</td>
                  <td>{game.groupName ?? "-"}</td>
                  <td>{new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Sao_Paulo"
                  }).format(game.startsAt).replace(",", "")}</td>
                  <td>{game.status}</td>
                  <td>{game._count.predictions}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link className="button secondary" href="/admin/jogos">Editar jogo</Link>
                      {game.status !== "CANCELADO" ? (
                        <Link className="button" href="/admin/resultados">Lançar resultado</Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {todayGames.length === 0 ? <p className="muted">Nenhum jogo cadastrado para hoje.</p> : null}
      </section>
    </main>
  );
}
