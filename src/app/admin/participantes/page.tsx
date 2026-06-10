import { AdminNav } from "@/components/AdminNav";
import { CopyAccessLink } from "@/components/CopyAccessLink";
import { MessageBanner } from "@/components/MessageBanner";
import { setParticipantPaid } from "@/lib/actions";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { buildAppUrl, getBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function AdminParticipantsPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireAdmin();
  const { ok, erro } = await searchParams;
  const [participants, baseUrl] = await Promise.all([
    prisma.participant.findMany({ orderBy: { createdAt: "desc" } }),
    getBaseUrl()
  ]);

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <AdminNav />
      <h1>Participantes</h1>
      <MessageBanner ok={ok} erro={erro} />
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>WhatsApp</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Link</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.id}>
                {(() => {
                  const path = `/participante/${participant.accessToken}`;
                  const absoluteUrl = buildAppUrl(baseUrl, path);

                  return (
                    <>
                <td>{participant.name}</td>
                <td>{participant.whatsapp}</td>
                <td>{participant.paid ? "Pago" : "Pendente"}</td>
                <td>{formatDateTime(participant.createdAt)}</td>
                <td className="stack">
                  <code>{absoluteUrl}</code>
                  <CopyAccessLink path={path} absoluteUrl={absoluteUrl} />
                </td>
                <td>
                  <form action={setParticipantPaid}>
                    <input type="hidden" name="id" value={participant.id} />
                    <input type="hidden" name="paid" value={participant.paid ? "false" : "true"} />
                    <button type="submit" className={participant.paid ? "danger" : ""}>
                      {participant.paid ? "Remover pagamento" : "Confirmar pagamento"}
                    </button>
                  </form>
                </td>
                    </>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
