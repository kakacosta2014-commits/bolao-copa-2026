import Link from "next/link";
import { ResumeAccess } from "@/components/ResumeAccess";
import { MessageBanner } from "@/components/MessageBanner";
import { formatCurrency, toNumber } from "@/lib/format";
import { getRankingData } from "@/lib/ranking";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { ok, erro } = await searchParams;
  const settings = await getSettings();
  const { prizes } = await getRankingData();

  return (
    <main>
      <section className="hero">
        <div className="container stack">
          <p style={{ fontWeight: 900, color: "#f5c542" }}>Bolao privado entre amigos</p>
          <h1 style={{ fontSize: "clamp(2.2rem, 8vw, 4.8rem)", lineHeight: 1, margin: 0 }}>
            {settings.poolName}
          </h1>
          <p style={{ maxWidth: 680, fontSize: "1.15rem" }}>
            Entre no jogo, faça seus palpites da Copa e acompanhe a briga pelo topo do ranking.
            Simples, fechado e organizado.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="button" href="/entrar">Participar do Bolao</Link>
            <Link className="button secondary" href="/ranking">Ver Ranking</Link>
            <ResumeAccess />
          </div>
        </div>
      </section>

      <section className="container stack" style={{ padding: "2rem 0" }}>
        <MessageBanner ok={ok} erro={erro} />
        <div className="grid-auto">
          <div className="card">
            <h2>Entrada</h2>
            <p style={{ fontSize: 30, fontWeight: 900 }}>{formatCurrency(toNumber(settings.entryFee))}</p>
            <p className="muted">Pagamento via PIX manual, confirmado pelo administrador.</p>
          </div>
          <div className="card">
            <h2>Premiacao</h2>
            <p>Organizador: {formatCurrency(prizes.organizer)}</p>
            <p>1o lugar: {formatCurrency(prizes.firstPlace)}</p>
            <p>2o lugar: {formatCurrency(prizes.secondPlace)}</p>
            <p>3o lugar: {formatCurrency(prizes.thirdPlace)}</p>
          </div>
          <div className="card">
            <h2>Pontuacao</h2>
            <p>Placar exato: 10 pontos</p>
            <p>Resultado correto: 5 pontos</p>
            <p>Jogador que marcou gol: +5 pontos</p>
            <p>Campeao e artilheiro: +20 pontos cada no final</p>
          </div>
        </div>
        <div className="card stack">
          <h2>Como participar</h2>
          <ol className="stack" style={{ paddingLeft: "1.25rem" }}>
            <li>Faca seu cadastro.</li>
            <li>Pague {formatCurrency(toNumber(settings.entryFee))} via PIX.</li>
            <li>Envie o comprovante ao organizador.</li>
            <li>Aguarde a confirmacao do pagamento.</li>
            <li>Faca seus palpites antes dos jogos.</li>
            <li>Acompanhe o ranking.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
