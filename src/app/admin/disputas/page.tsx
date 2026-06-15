import { AdminNav } from "@/components/AdminNav";
import { MessageBanner } from "@/components/MessageBanner";
import { PrizePercentagesForm } from "@/components/PrizePercentagesForm";
import { confirmParticipantDisputePayment, markParticipantDisputePending } from "@/lib/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { calculatePrizeCents } from "@/lib/prizes";

export const dynamic = "force-dynamic";

type DisputeWithRelations = Awaited<ReturnType<typeof getDisputes>>[number];

function centsToCurrency(cents: number) {
  return formatCurrency(cents / 100);
}

function getDisputeMetrics(dispute: DisputeWithRelations) {
  const paidParticipants = dispute.participants.filter((participant) => participant.paymentStatus === "PAID");
  const totalCents = paidParticipants.length * dispute.entryFeeCents;

  return {
    games: dispute._count.games,
    participants: dispute._count.participants,
    paid: paidParticipants.length,
    pending: dispute.participants.length - paidParticipants.length,
    totalCents,
    organizerCents: calculatePrizeCents(totalCents, dispute.organizerPrizePercent),
    firstCents: calculatePrizeCents(totalCents, dispute.firstPrizePercent),
    secondCents: calculatePrizeCents(totalCents, dispute.secondPrizePercent),
    thirdCents: calculatePrizeCents(totalCents, dispute.thirdPrizePercent)
  };
}

async function getDisputes() {
  return prisma.dispute.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { games: true, participants: true } },
      participants: {
        include: { participant: true },
        orderBy: { participant: { name: "asc" } }
      }
    }
  });
}

export default async function AdminDisputesPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireAdmin();
  const { ok, erro } = await searchParams;
  const disputes = await getDisputes();

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <AdminNav />
      <h1>Disputas</h1>
      <MessageBanner ok={ok} erro={erro} />
      <p className="muted">Visualização administrativa das disputas. Pagamentos e rankings por disputa ainda não são editados nesta tela.</p>

      <section className="dispute-summary-grid">
        {disputes.map((dispute) => {
          const metrics = getDisputeMetrics(dispute);

          return (
            <article key={dispute.id} className="card stack dispute-card">
              <div className="section-heading">
                <div>
                  <h2>{dispute.name}</h2>
                  <p className="muted compact-text">/{dispute.slug}</p>
                </div>
                <span className={`status-pill ${dispute.isActive ? "status-paid" : "status-ended"}`}>
                  {dispute.isActive ? "Ativa" : "Inativa"}
                </span>
              </div>
              <p className="muted">{dispute.description ?? "Sem descrição."}</p>
              <div className="dispute-metrics">
                <Metric label="Entrada" value={centsToCurrency(dispute.entryFeeCents)} />
                <Metric label="Jogos" value={metrics.games} />
                <Metric label="Participantes" value={metrics.participants} />
                <Metric label="Pagos" value={metrics.paid} />
                <Metric label="Pendentes" value={metrics.pending} />
                <Metric label="Arrecadado" value={centsToCurrency(metrics.totalCents)} />
              </div>
              <div className="prize-grid">
                <Metric label={`Organizador ${dispute.organizerPrizePercent}%`} value={centsToCurrency(metrics.organizerCents)} />
                <Metric label={`1o lugar ${dispute.firstPrizePercent}%`} value={centsToCurrency(metrics.firstCents)} />
                <Metric label={`2o lugar ${dispute.secondPrizePercent}%`} value={centsToCurrency(metrics.secondCents)} />
                <Metric label={`3o lugar ${dispute.thirdPrizePercent}%`} value={centsToCurrency(metrics.thirdCents)} />
              </div>
              <PrizePercentagesForm
                disputeId={dispute.id}
                organizerPrizePercent={dispute.organizerPrizePercent}
                firstPrizePercent={dispute.firstPrizePercent}
                secondPrizePercent={dispute.secondPrizePercent}
                thirdPrizePercent={dispute.thirdPrizePercent}
              />
              <p>
                <span className="status-pill">
                  {dispute.includesSpecialPredictions ? "Inclui campeão e artilheiro" : "Sem especiais"}
                </span>
              </p>
              <p>
                <a className="button secondary" href={`/admin/ranking?disputa=${dispute.slug}`}>
                  Ver ranking desta disputa
                </a>
              </p>
              {metrics.games === 0 ? <p className="warning-text">Esta disputa ainda não possui jogos vinculados.</p> : null}
              {metrics.participants === 0 ? <p className="muted">Nenhum participante vinculado a esta disputa ainda.</p> : null}
            </article>
          );
        })}
      </section>

      <section className="stack">
        <h2>Resumo detalhado</h2>
        <div className="card disputes-desktop">
          <table className="disputes-table">
            <thead>
              <tr>
                <th>Disputa</th>
                <th>Jogos</th>
                <th>Participantes</th>
                <th>Pagos</th>
                <th>Pendentes</th>
                <th>Arrecadado</th>
                <th>Premiação 1º / 2º / 3º</th>
                <th>Especiais</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => {
                const metrics = getDisputeMetrics(dispute);

                return (
                  <tr key={dispute.id}>
                    <td>
                      <strong>{dispute.name}</strong>
                      <span className="muted table-detail">{dispute.slug}</span>
                    </td>
                    <td>{metrics.games}</td>
                    <td>{metrics.participants}</td>
                    <td>{metrics.paid}</td>
                    <td>{metrics.pending}</td>
                    <td>{centsToCurrency(metrics.totalCents)}</td>
                    <td>
                      {centsToCurrency(metrics.firstCents)} / {centsToCurrency(metrics.secondCents)} / {centsToCurrency(metrics.thirdCents)}
                    </td>
                    <td>{dispute.includesSpecialPredictions ? "Inclui campeão e artilheiro" : "Sem especiais"}</td>
                    <td>{dispute.isActive ? "Ativa" : "Inativa"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="disputes-mobile stack">
          {disputes.map((dispute) => {
            const metrics = getDisputeMetrics(dispute);

            return (
              <article key={dispute.id} className="card stack">
                <div className="section-heading">
                  <strong>{dispute.name}</strong>
                  <span className={`status-pill ${dispute.isActive ? "status-paid" : "status-ended"}`}>
                    {dispute.isActive ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <div className="dispute-metrics">
                  <Metric label="Jogos" value={metrics.games} />
                  <Metric label="Participantes" value={metrics.participants} />
                  <Metric label="Pagos" value={metrics.paid} />
                  <Metric label="Pendentes" value={metrics.pending} />
                  <Metric label="Arrecadado" value={centsToCurrency(metrics.totalCents)} />
                  <Metric label="1º / 2º / 3º" value={`${centsToCurrency(metrics.firstCents)} / ${centsToCurrency(metrics.secondCents)} / ${centsToCurrency(metrics.thirdCents)}`} />
                </div>
                <p className="muted compact-text">
                  {dispute.includesSpecialPredictions ? "Inclui campeão e artilheiro" : "Sem especiais"}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="stack">
        <h2>Participantes por disputa</h2>
        {disputes.map((dispute) => (
          <article key={dispute.id} className="card stack">
            <div className="section-heading">
              <h3>{dispute.name}</h3>
              <span className="status-pill">{dispute.participants.length} participantes</span>
            </div>
            {dispute.participants.length === 0 ? (
              <p className="muted">Nenhum participante vinculado a esta disputa ainda.</p>
            ) : (
              <div className="participant-dispute-list">
                {dispute.participants.map((item) => (
                  <div key={item.id} className="participant-dispute-row">
                    <div>
                      <strong>{item.participant.name}</strong>
                      <span className="muted table-detail">{item.participant.whatsapp}</span>
                    </div>
                    <span className={`status-pill ${item.paymentStatus === "PAID" ? "status-paid" : "status-pending"}`}>
                      {item.paymentStatus === "PAID" ? "Pago" : "Pendente"}
                    </span>
                    <span className="muted">
                      {item.paidAt ? `Pago em ${formatDateTime(item.paidAt)}` : "Sem data de pagamento"}
                    </span>
                    <form
                      action={item.paymentStatus === "PAID" ? markParticipantDisputePending : confirmParticipantDisputePayment}
                      className="participant-dispute-payment-form"
                    >
                      <input type="hidden" name="participantDisputeId" value={item.id} />
                      <button type="submit" className={item.paymentStatus === "PAID" ? "secondary" : ""}>
                        {item.paymentStatus === "PAID" ? "Marcar como pendente" : "Confirmar pagamento"}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
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
