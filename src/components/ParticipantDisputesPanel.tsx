import Link from "next/link";
import { joinDispute } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";

type ParticipantDisputeItem = {
  id: string;
  paymentStatus: string;
  paidAt: Date | null;
  dispute: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    entryFeeCents: number;
    includesSpecialPredictions: boolean;
    _count: { games: number };
  };
};

type AvailableDispute = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  entryFeeCents: number;
  includesSpecialPredictions: boolean;
  _count: { games: number };
};

export function ParticipantDisputesPanel({
  token,
  participantDisputes,
  availableDisputes
}: {
  token: string;
  participantDisputes: ParticipantDisputeItem[];
  availableDisputes: AvailableDispute[];
}) {
  return (
    <section className="card stack" id="minhas-disputas">
      <div>
        <h2>Minhas disputas</h2>
        <p className="muted compact-text">Use o mesmo acesso para participar de mais de uma disputa.</p>
      </div>

      <div className="participant-dispute-grid">
        {participantDisputes.map((item) => (
          <article key={item.id} className="participant-dispute-card">
            <div className="section-heading">
              <h3>{item.dispute.name}</h3>
              <span className={`status-pill ${item.paymentStatus === "PAID" ? "status-paid" : "status-pending"}`}>
                {item.paymentStatus === "PAID" ? "Pago" : "Pendente"}
              </span>
            </div>
            <p className="muted">{item.dispute.description ?? "Sem descrição."}</p>
            <div className="participant-dispute-meta">
              <span>{formatCurrency(item.dispute.entryFeeCents / 100)}</span>
              <span>{item.dispute._count.games} jogos</span>
              <span>{item.dispute.includesSpecialPredictions ? "Inclui campeão e artilheiro" : "Sem especiais"}</span>
            </div>
            {item.paymentStatus !== "PAID" ? (
              <p className="muted compact-text">Pagamento pendente de confirmação pelo administrador.</p>
            ) : null}
            <div className="participant-dispute-actions">
              <Link className="button secondary" href={`/participante/${token}/disputas/${item.dispute.slug}`}>
                Ver jogos desta disputa
              </Link>
              <Link className="button secondary" href={`/ranking?disputa=${item.dispute.slug}`}>
                Ver ranking desta disputa
              </Link>
            </div>
          </article>
        ))}
        {participantDisputes.length === 0 ? (
          <p className="muted">Você ainda não participa de nenhuma disputa.</p>
        ) : null}
      </div>

      <div className="stack">
        <h3>Outras disputas disponíveis</h3>
        <div className="participant-dispute-grid">
          {availableDisputes.map((dispute) => (
            <article key={dispute.id} className="participant-dispute-card">
              <div>
                <h4>{dispute.name}</h4>
                <p className="muted">{dispute.description ?? "Sem descrição."}</p>
              </div>
              <div className="participant-dispute-meta">
                <span>{formatCurrency(dispute.entryFeeCents / 100)}</span>
                <span>{dispute._count.games} jogos</span>
                <span>{dispute.includesSpecialPredictions ? "Inclui campeão e artilheiro" : "Sem especiais"}</span>
              </div>
              <div className="participant-dispute-actions">
                <Link className="button secondary" href={`/participante/${token}/disputas/${dispute.slug}`}>
                  Ver jogos desta disputa
                </Link>
                <Link className="button secondary" href={`/ranking?disputa=${dispute.slug}`}>
                  Ver ranking desta disputa
                </Link>
              </div>
              <form action={joinDispute}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="disputeId" value={dispute.id} />
                <button type="submit">Entrar nesta disputa</button>
              </form>
            </article>
          ))}
          {availableDisputes.length === 0 ? (
            <p className="muted">Você já participa de todas as disputas disponíveis.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
