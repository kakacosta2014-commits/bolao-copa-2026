import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { MessageBanner } from "@/components/MessageBanner";
import { StatCard } from "@/components/StatCard";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { getRankingData } from "@/lib/ranking";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireAdmin();
  const { ok, erro } = await searchParams;
  const [participants, paid, games, finishedGames, { prizes }] = await Promise.all([
    prisma.participant.count(),
    prisma.participant.count({ where: { paid: true } }),
    prisma.game.count(),
    prisma.game.count({ where: { homeScore: { not: null }, awayScore: { not: null } } }),
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
    </main>
  );
}
