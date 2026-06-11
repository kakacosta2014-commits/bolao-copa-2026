import { AdminNav } from "@/components/AdminNav";
import { CopyAccessLink } from "@/components/CopyAccessLink";
import { DeleteParticipantButton } from "@/components/DeleteParticipantButton";
import { MessageBanner } from "@/components/MessageBanner";
import { setParticipantPaid } from "@/lib/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getSystemMessage } from "@/lib/messages";
import { buildAppUrl, getBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function AdminParticipantsPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string; success?: string; error?: string }>;
}) {
  await requireAdmin();
  const { ok, erro, success, error } = await searchParams;
  const [participants, baseUrl] = await Promise.all([
    prisma.participant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { predictions: true } },
        specialPrediction: { select: { id: true } }
      }
    }),
    getBaseUrl()
  ]);

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <AdminNav />
      <h1>Participantes</h1>
      <MessageBanner ok={ok ?? getSystemMessage(success) ?? undefined} erro={erro ?? getSystemMessage(error) ?? undefined} />

      <div className="card participants-desktop">
        <table className="participants-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>WhatsApp</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.id}>
                {(() => {
                  const path = `/participante/${participant.accessToken}`;
                  const absoluteUrl = buildAppUrl(baseUrl, path);
                  const canDelete = !participant.paid && participant._count.predictions === 0 && !participant.specialPrediction;

                  return (
                    <>
                      <td>{participant.name}</td>
                      <td>{participant.whatsapp}</td>
                      <td>{participant.paid ? "Pago" : "Pendente"}</td>
                      <td>{formatDateTime(participant.createdAt)}</td>
                      <td>
                        <div className="participant-actions">
                          <CopyAccessLink path={path} absoluteUrl={absoluteUrl} />
                          <form action={setParticipantPaid}>
                            <input type="hidden" name="id" value={participant.id} />
                            <input type="hidden" name="paid" value={participant.paid ? "false" : "true"} />
                            <button type="submit" className={participant.paid ? "danger" : ""}>
                              {participant.paid ? "Remover pagamento" : "Confirmar pagamento"}
                            </button>
                          </form>
                          {canDelete ? <DeleteParticipantButton participantId={participant.id} /> : null}
                        </div>
                      </td>
                    </>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="participants-mobile stack">
        {participants.map((participant) => {
          const path = `/participante/${participant.accessToken}`;
          const absoluteUrl = buildAppUrl(baseUrl, path);
          const canDelete = !participant.paid && participant._count.predictions === 0 && !participant.specialPrediction;

          return (
            <article key={participant.id} className="card participant-card">
              <div>
                <span className="muted">Nome</span>
                <strong>{participant.name}</strong>
              </div>
              <div>
                <span className="muted">WhatsApp</span>
                <strong>{participant.whatsapp}</strong>
              </div>
              <div>
                <span className="muted">Status</span>
                <strong>{participant.paid ? "Pago" : "Pendente"}</strong>
              </div>
              <div>
                <span className="muted">Data de cadastro</span>
                <strong>{formatDateTime(participant.createdAt)}</strong>
              </div>
              <p className="muted compact-text">Link individual de acesso</p>
              <div className="participant-actions">
                <CopyAccessLink path={path} absoluteUrl={absoluteUrl} />
                <form action={setParticipantPaid}>
                  <input type="hidden" name="id" value={participant.id} />
                  <input type="hidden" name="paid" value={participant.paid ? "false" : "true"} />
                  <button type="submit" className={participant.paid ? "danger" : ""}>
                    {participant.paid ? "Remover pagamento" : "Confirmar pagamento"}
                  </button>
                </form>
                {canDelete ? <DeleteParticipantButton participantId={participant.id} /> : null}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
