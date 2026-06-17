import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { saveSpecialPrediction } from "@/lib/actions";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";
import { MessageBanner } from "@/components/MessageBanner";
import { ParticipantDisputesPanel } from "@/components/ParticipantDisputesPanel";
import { ParticipantPredictionCard } from "@/components/ParticipantPredictionCard";
import { SwitchParticipantLink } from "@/components/SwitchParticipantLink";
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
  const [participant, games, settings, activeDisputes] = await Promise.all([
    prisma.participant.findUnique({
      where: { accessToken: token },
      include: {
        predictions: true,
        specialPrediction: true,
        disputes: {
          include: {
            dispute: {
              include: { _count: { select: { games: true } } }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    }),
    prisma.game.findMany({ orderBy: { startsAt: "asc" } }),
    getSettings(),
    prisma.dispute.findMany({
      where: { isActive: true },
      include: { _count: { select: { games: true } } },
      orderBy: { createdAt: "asc" }
    })
  ]);

  if (!participant) notFound();

  const participantData = participant;
  const predictionByGameId = new Map(participantData.predictions.map((prediction) => [prediction.gameId, prediction]));
  const totalPoints =
    participantData.predictions.reduce((sum, prediction) => sum + prediction.totalPoints, 0) +
    (participantData.specialPrediction?.totalPoints ?? 0);
  const whatsappMessage = `Ola, fiz o PIX do Bolao da Copa. Meu nome e ${participantData.name}. Segue o comprovante.`;
  const whatsappLink = buildWhatsAppLink(settings.organizerWhatsapp, whatsappMessage);

  const openGames = games.filter((game) => canPredict(game.startsAt));
  const blockedGames = games.filter((game) => !canPredict(game.startsAt));
  const pendingGames = openGames.filter((game) => !predictionByGameId.has(game.id));
  const pendingTodayGames = pendingGames.filter((game) => isGameToday(game.startsAt));
  const pendingOtherGames = pendingGames.filter((game) => !isGameToday(game.startsAt));
  const editablePredictedGames = openGames.filter((game) => predictionByGameId.has(game.id));
  const blockedWithoutPrediction = blockedGames.filter((game) => !predictionByGameId.has(game.id));
  const progressPercent = games.length > 0 ? Math.round((participantData.predictions.length / games.length) * 100) : 0;
  const participantDisputeIds = new Set(participantData.disputes.map((item) => item.disputeId));
  const availableDisputes = activeDisputes.filter((dispute) => !participantDisputeIds.has(dispute.id));

  function renderPredictionCard(game: (typeof games)[number], highlight = false) {
    const prediction = predictionByGameId.get(game.id);

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
      <InstallAppPrompt />
      <div className="card participant-header">
        <div className="participant-title">
          <Image
            src="/logo-bolao-copa-2026.png"
            alt="Bolão Copa 2026"
            width={56}
            height={56}
            className="participant-logo"
            priority
          />
          <div>
            <h1>Area de {participantData.name}</h1>
            <p className="muted">
              Status: {participantData.paid ? "pagamento confirmado" : "aguardando confirmacao de pagamento"}
            </p>
            <div className="participant-switch-action">
              <SwitchParticipantLink />
            </div>
          </div>
        </div>
        <nav className="participant-nav" aria-label="Atalhos principais">
          <Link className="button secondary" href="#faltam-fazer">Meus palpites</Link>
          <Link className="button secondary" href="/jogos">Jogos</Link>
          <Link className="button secondary" href="/ranking">Ranking</Link>
          <Link className="button secondary" href="/regras">Regras</Link>
        </nav>
      </div>

      <ParticipantDisputesPanel
        token={token}
        participantDisputes={participantData.disputes}
        availableDisputes={availableDisputes}
      />

      <section className="card stack" aria-labelledby="resumo-palpites">
        <div className="section-heading">
          <div>
            <h2 id="resumo-palpites">Resumo dos palpites</h2>
            <p className="muted compact-text">
              Você já fez {participantData.predictions.length} de {games.length} palpites disponíveis.
            </p>
          </div>
          <strong>Faltam {pendingGames.length} palpites.</strong>
        </div>
        <div className="progress-bar" aria-label={`Progresso dos palpites: ${progressPercent}%`}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="progress-stats">
          <div>
            <span className="muted">Palpites feitos</span>
            <strong>{participantData.predictions.length}</strong>
          </div>
          <div>
            <span className="muted">Faltam fazer</span>
            <strong>{pendingGames.length}</strong>
          </div>
          <div>
            <span className="muted">Bloqueados sem palpite</span>
            <strong>{blockedWithoutPrediction.length}</strong>
          </div>
          <div>
            <span className="muted">Total de jogos</span>
            <strong>{games.length}</strong>
          </div>
        </div>
        <nav className="participant-nav quick-nav" aria-label="Atalhos dos palpites">
          <Link className="button secondary" href="#faltam-fazer">Faltam fazer</Link>
          <Link className="button secondary" href="#ja-feitos">Já feitos</Link>
          <Link className="button secondary" href="#bloqueados">Bloqueados</Link>
          <Link className="button secondary" href="#todos-os-jogos">Todos os jogos</Link>
          <Link className="button secondary" href="/ranking">Ranking</Link>
          <Link className="button secondary" href="/regras">Regras</Link>
        </nav>
      </section>

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

          <div id="todos-os-jogos" className="stack">
            <section id="faltam-fazer" className="stack">
              <div className="section-heading">
                <div>
                  <h2>Faltam fazer</h2>
                  <p className="muted compact-text">Estes jogos ainda estão abertos e sem palpite.</p>
                </div>
                <Link href="#topo" className="button secondary">Voltar ao topo</Link>
              </div>
              {pendingTodayGames.length > 0 ? (
                <div className="stack">
                  <h3>Faltam fazer hoje</h3>
                  {pendingTodayGames.map((game) => renderPredictionCard(game, true))}
                </div>
              ) : null}
              {pendingOtherGames.map((game) => renderPredictionCard(game))}
              {pendingGames.length === 0 ? (
                <p className="card muted">Você já fez todos os palpites disponíveis no momento.</p>
              ) : null}
            </section>

            <section id="ja-feitos" className="stack">
              <div className="section-heading">
                <div>
                  <h2>Palpites já feitos</h2>
                  <p className="muted compact-text">Você pode editar os palpites enquanto o jogo ainda não começou.</p>
                </div>
                <Link href="#topo" className="button secondary">Voltar ao topo</Link>
              </div>
              {editablePredictedGames.map((game) => renderPredictionCard(game, isGameToday(game.startsAt)))}
              {editablePredictedGames.length === 0 ? (
                <p className="card muted">Nenhum palpite editável no momento.</p>
              ) : null}
            </section>

            <section id="bloqueados" className="stack">
              <div className="section-heading">
                <div>
                  <h2>Jogos bloqueados</h2>
                  <p className="muted compact-text">Estes jogos já começaram ou foram encerrados.</p>
                </div>
                <Link href="#topo" className="button secondary">Voltar ao topo</Link>
              </div>
              {blockedGames.map((game) => renderPredictionCard(game))}
              {blockedGames.length === 0 ? <p className="card muted">Nenhum jogo bloqueado no momento.</p> : null}
              {games.length === 0 ? <p className="card muted">Nenhum jogo cadastrado ainda.</p> : null}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
