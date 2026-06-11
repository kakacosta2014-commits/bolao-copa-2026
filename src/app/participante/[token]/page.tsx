import Link from "next/link";
import { notFound } from "next/navigation";
import { savePrediction, saveSpecialPrediction } from "@/lib/actions";
import { MessageBanner } from "@/components/MessageBanner";
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
  const otherGames = games.filter((game) => !isGameToday(game.startsAt));

  function renderPredictionForm(game: (typeof games)[number], highlight = false) {
    const prediction = participantData.predictions.find((item) => item.gameId === game.id);
    const open = canPredict(game.startsAt);

    return (
      <form
        key={game.id}
        action={savePrediction}
        className="card stack"
        style={highlight ? { borderColor: "#0f8a4b" } : undefined}
      >
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="gameId" value={game.id} />
        <div>
          <strong>Jogo {game.number}: {game.homeTeam} x {game.awayTeam}</strong>
          <p className="muted">
            {game.stage} {game.groupName ? `- Grupo ${game.groupName}` : ""} - {formatDateTime(game.startsAt)} - Horário de Brasília
          </p>
          <p className="muted">
            Status: {game.status}. {open ? "Palpites abertos até o início da partida." : "Palpites encerrados para este jogo."}
          </p>
        </div>
        <div className="grid-auto">
          <label>
            Gols {game.homeTeam}
            <input name="predictedHomeScore" type="number" min="0" defaultValue={prediction?.predictedHomeScore ?? 0} disabled={!open} required />
          </label>
          <label>
            Gols {game.awayTeam}
            <input name="predictedAwayScore" type="number" min="0" defaultValue={prediction?.predictedAwayScore ?? 0} disabled={!open} required />
          </label>
          <label>
            Escolha 1 jogador para marcar gol
            <input
              name="predictedGoalScorer"
              defaultValue={prediction?.predictedGoalScorer ?? ""}
              disabled={!open}
              placeholder="Ex: Vini Jr"
            />
            <span className="muted field-help">
              Digite apenas um nome. Se esse jogador fizer gol em qualquer momento da partida, você ganha 5 pontos.
            </span>
            <span className="warning-text">
              Não coloque vários jogadores. Só será aceito um jogador por jogo.
            </span>
          </label>
        </div>
        {prediction ? (
          <p className="muted">
            Seu palpite: {game.homeTeam} {prediction.predictedHomeScore} x {prediction.predictedAwayScore} {game.awayTeam}
            {prediction.predictedGoalScorer ? `, gol de ${prediction.predictedGoalScorer}` : ""}. Pontos neste jogo: {prediction.totalPoints}.
          </p>
        ) : (
          <p className="muted">Você ainda não salvou palpite para este jogo.</p>
        )}
        <button type="submit" disabled={!open}>Salvar palpite</button>
      </form>
    );
  }

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <TokenSaver token={token} />
      <MessageBanner ok={ok} erro={erro} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1>Area de {participantData.name}</h1>
          <p className="muted">Status: {participantData.paid ? "pagamento confirmado" : "aguardando confirmacao de pagamento"}</p>
        </div>
        <Link className="button secondary" href="/ranking">Ver ranking</Link>
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
            <h2>Seus pontos: {totalPoints}</h2>
            <form action={saveSpecialPrediction} className="grid-auto">
              <input type="hidden" name="token" value={token} />
              <label>
                Campeao
                <input
                  name="championTeam"
                  defaultValue={participantData.specialPrediction?.championTeam ?? ""}
                  disabled={settings.specialPredictionsLocked}
                  required
                />
              </label>
              <label>
                Artilheiro
                <input
                  name="topScorerPlayer"
                  defaultValue={participantData.specialPrediction?.topScorerPlayer ?? ""}
                  disabled={settings.specialPredictionsLocked}
                  required
                />
              </label>
              <div style={{ alignSelf: "end" }}>
                <button type="submit" disabled={settings.specialPredictionsLocked}>
                  Salvar especiais
                </button>
              </div>
            </form>
            {settings.specialPredictionsLocked ? <p className="muted">Palpites especiais bloqueados.</p> : null}
          </section>

          <section className="stack">
            <h2>Jogos de hoje</h2>
            <p className="muted">Horários exibidos em horário de Brasília.</p>
            {todayGames.map((game) => renderPredictionForm(game, true))}
            {todayGames.length === 0 ? <p className="muted">Nenhum jogo cadastrado para hoje.</p> : null}
          </section>

          <section className="stack">
            <h2>Demais jogos</h2>
            {otherGames.map((game) => renderPredictionForm(game))}
            {games.length === 0 ? <p className="muted">Nenhum jogo cadastrado ainda.</p> : null}
          </section>
        </>
      )}
    </main>
  );
}
