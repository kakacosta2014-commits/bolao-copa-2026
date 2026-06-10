import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/format";
import { getRankingData } from "@/lib/ranking";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const { ranking, prizes } = await getRankingData();

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <h1>Ranking Geral</h1>
      <div className="grid-auto">
        <StatCard label="Participantes pagos" value={prizes.paidParticipants} />
        <StatCard label="Total arrecadado" value={formatCurrency(prizes.total)} />
        <StatCard label="Organizador" value={formatCurrency(prizes.organizer)} />
        <StatCard label="1o lugar" value={formatCurrency(prizes.firstPlace)} />
        <StatCard label="2o lugar" value={formatCurrency(prizes.secondPlace)} />
        <StatCard label="3o lugar" value={formatCurrency(prizes.thirdPlace)} />
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Posicao</th>
              <th>Participante</th>
              <th>Jogos</th>
              <th>Campeao</th>
              <th>Artilheiro</th>
              <th>Total</th>
              <th>Exatos</th>
              <th>Resultados</th>
              <th>Jogadores-gol</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((participant, index) => (
              <tr key={participant.id}>
                <td>{index + 1}o</td>
                <td>{participant.name}</td>
                <td>{participant.gamePoints}</td>
                <td>{participant.championPoints}</td>
                <td>{participant.topScorerPoints}</td>
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
    </main>
  );
}
