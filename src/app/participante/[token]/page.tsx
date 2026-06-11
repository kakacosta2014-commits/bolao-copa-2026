import Link from "next/link";
import { notFound } from "next/navigation";
import { saveSpecialPrediction } from "@/lib/actions";
import { MessageBanner } from "@/components/MessageBanner";
import { ParticipantPredictionCard } from "@/components/ParticipantPredictionCard";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/format";
import { canPredict, isGameToday } from "@/lib/games";
import { getSettings } from "@/lib/settings";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { TokenSaver } from "./TokenSaver";

export const dynamic = "force-dynamic";

export default async function ParticipantPage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { token } = await params;
  const { ok, erro } = await searchParams;
  const [participant, games, settings] = await Promise.all([
    prisma.participant.findUnique({
      where: { accessToken: token },
      include: { predictions: true, specialPrediction: true }
    }),
    prisma.game.findMany({ orderBy: { startsAt: "asc" } }),
    getSettings()
  ]);

  if (!participant) notFound();

  const participantData = participant;
  const totalPoints =
    participantData.predictions.reduce((sum, prediction) => sum + prediction.totalPoints, 0) +
    (participantData.specialPrediction?.totalPoints ?? 0);
  const whatsappMessage = `Ola, fiz o PIX do Bolao da Copa. Meu nome e ${participantData.name}. Segue o comprovante.`;
  const whatsappLink = buildWhatsAppLink(settings.organizerWhatsapp, whatsappMessage);
  const todayGames = games.filter((game) => isGameToday(game.startsAt));
  const upcomingGames = games.filter((game) => !isGameToday(game.startsAt) && canPredict(game.startsAt));
  const lockedGames = games.filter((game) => !isGameToday(game.startsAt) && !canPredict(game.startsAt));

  function renderPredictionCard(game: (typeof games)[number], highlight = false) {
    const prediction = participantData.predictions.find((item) => item.gameId === game.id);

    return (
      <ParticipantPredictionCard
        key={game.id}
        token={token}
        highlight={highlight}
        game={{
          id: game.id,
          number: game.number,
          stage: game.stage,
          groupName: game.groupName,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          startsAtIso: game.startsAt.toISOString(),
          startsAtLabel: formatDateTime(game.startsAt),
          status: game.status
        }}
        prediction={
          prediction
            ? {
                predictedHomeScore: prediction.predictedHomeScore,
                predictedAwayScore: prediction.predictedAwayScore,
                predictedGoalScorer: prediction.predictedGoalScorer,
                totalPoints: prediction.totalPoints
              }
            : null
        }
      />
    );
  }

  return (
    <main id="topo" className="container stack" style={{ padding: "2rem 0" }}>
      <TokenSaver token={token} />
      <MessageBanner ok={ok} erro={erro} />
      <div className="card participant-header">
        <div>
          <h1>Area de {participantData.name}</h1>
          <p className="muted">
            Status: {participantData.paid ? "pagamento confirmado" : "aguardando confirmacao de pagamento"}
          </p>
        </div>
        <nav className="participant-nav" aria-label="Atalhos do participante">
          <Link className="button secondary" href="/">Início</Link>
          <Link className="button secondary" href="/jogos">Ver jogos</Link>
          <Link className="button secondary" href="/ranking">Ver ranking</Link>
          <Link className="button secondary" href="/regras">Ver regras</Link>
        </nav>
      </div>

      {!participantData.paid ? (
        <section className="card stack">
          <h2>Pagamento pendente</h2>
          <p>Valor: <strong>{formatCurrency(toNumber(settings.entryFee))}</strong></p>
          <p>Chave PIX: <strong>{settings.pixKey || "Aguardando configuracao do organizador"}</strong></p>
          <p>Recebedor: <strong>{settings.pixReceiverName || "Aguardando configuracao do organizador"}</strong></p>
          <p>WhatsApp do organizador: <strong>{settings.organizerWhatsapp || "Nao configurado"}</strong></p>
          {whatsappLink ? (
            <Link className="button" href={whatsappLink} target="_blank">
              Enviar comprovante pelo WhatsApp
            </Link>
          ) : (
            <p className="muted">Depois de pagar, envie o comprovante manualmente ao organizador para liberar seus palpites.</p>
          )}
        </section>
      ) : (
        <>
          <section className="card stack">
            <div className="section-heading">
              <h2>Palpites especiais</h2>
              <strong>Seus pontos: {totalPoints}</strong>
            </div>
            <div className="special-summary">
              <div>
                <span className="muted">Campeão escolhido</span>
                <strong>{participantData.specialPrediction?.championTeam || "Ainda não informado"}</strong>
              </div>
              <div>
                <span className="muted">Artilheiro escolhido</span>
                <strong>{participantData.specialPrediction?.topScorerPlayer || "Ainda não informado"}</strong>
              </div>
            </div>
            {settings.specialPredictionsLocked ? (
              <p className="muted">Palpites especiais bloqueados. Suas escolhas ficam travadas para consulta.</p>
            ) : (
              <form action={saveSpecialPrediction} className="grid-auto">
                <input type="hidden" name="token" value={token} />
                <label>
                  Campeao
                  <input
                    name="championTeam"
                    defaultValue={participantData.specialPrediction?.championTeam ?? ""}
                    required
                  />
                </label>
                <label>
                  Artilheiro
                  <input
                    name="topScorerPlayer"
                    defaultValue={participantData.specialPrediction?.topScorerPlayer ?? ""}
                    required
                  />
                </label>
                <div style={{ alignSelf: "end" }}>
                  <button type="submit">Salvar especiais</button>
                </div>
              </form>
            )}
          </section>

          <section id="jogos-hoje" className="stack">
            <h2>Jogos de hoje</h2>
            <p className="muted">Horários exibidos em horário de Brasília.</p>
            {todayGames.map((game) => renderPredictionCard(game, true))}
            {todayGames.length === 0 ? <p className="muted">Nenhum jogo cadastrado para hoje.</p> : null}
          </section>

          <section className="stack">
            <div className="section-heading">
              <h2>Próximos jogos</h2>
              <Link href="#topo" className="button secondary">Voltar ao topo</Link>
            </div>
            {upcomingGames.map((game) => renderPredictionCard(game))}
            {upcomingGames.length === 0 ? <p className="muted">Nenhum próximo jogo aberto para palpite.</p> : null}
          </section>

          <section className="stack">
            <div className="section-heading">
              <h2>Jogos encerrados/bloqueados</h2>
              <Link href="#jogos-hoje" className="button secondary">Voltar para jogos</Link>
            </div>
            {lockedGames.map((game) => renderPredictionCard(game))}
            {lockedGames.length === 0 ? <p className="muted">Nenhum jogo bloqueado fora de hoje.</p> : null}
            {games.length === 0 ? <p className="muted">Nenhum jogo cadastrado ainda.</p> : null}
          </section>
        </>
      )}
    </main>
  );
}
