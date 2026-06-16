import { registerParticipant } from "@/lib/actions";
import { DisputeSelection } from "@/components/DisputeSelection";
import { MessageBanner } from "@/components/MessageBanner";
import { prisma } from "@/lib/db";

export default async function EnterPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { ok, erro } = await searchParams;
  const disputes = await prisma.dispute.findMany({
    where: { isActive: true },
    include: { _count: { select: { games: true } } },
    orderBy: { createdAt: "asc" }
  });
  const generalDispute = disputes.find((dispute) => dispute.slug === "geral");
  const defaultSelectedIds = generalDispute ? [generalDispute.id] : [];

  return (
    <main className="container stack" style={{ padding: "2rem 0", maxWidth: 680 }}>
      <h1>Participar do Bolao</h1>
      <MessageBanner ok={ok} erro={erro} />
      <form action={registerParticipant} className="card stack">
        <div className="stack">
          <p className="muted">
            Voce pode participar de uma ou mais disputas. Cada disputa tem premiacao e ranking proprios.
            Apos o cadastro, envie o PIX e aguarde confirmacao do administrador.
          </p>
        </div>
        <label>
          Nome completo
          <input name="name" required minLength={3} />
        </label>
        <label>
          WhatsApp
          <input name="whatsapp" required placeholder="(00) 00000-0000" />
        </label>
        <DisputeSelection disputes={disputes} defaultSelectedIds={defaultSelectedIds} />
        <button type="submit">Criar meu acesso</button>
      </form>
    </main>
  );
}
