import { registerParticipant } from "@/lib/actions";
import { MessageBanner } from "@/components/MessageBanner";

export default async function EnterPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { ok, erro } = await searchParams;

  return (
    <main className="container stack" style={{ padding: "2rem 0", maxWidth: 680 }}>
      <h1>Participar do Bolao</h1>
      <MessageBanner ok={ok} erro={erro} />
      <form action={registerParticipant} className="card stack">
        <label>
          Nome completo
          <input name="name" required minLength={3} />
        </label>
        <label>
          WhatsApp
          <input name="whatsapp" required placeholder="(00) 00000-0000" />
        </label>
        <button type="submit">Criar meu acesso</button>
      </form>
    </main>
  );
}
