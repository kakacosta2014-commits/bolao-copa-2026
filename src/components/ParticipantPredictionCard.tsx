"use client";

import { useState } from "react";
import { savePrediction } from "@/lib/actions";
import { TeamBadge } from "@/components/TeamBadge";

type ParticipantPredictionCardProps = {
  game: {
    id: string;
    number: number;
    stage: string;
    groupName: string | null;
    homeTeam: string;
    awayTeam: string;
    startsAtIso: string;
    startsAtLabel: string;
    status: string;
  };
  prediction?: {
    predictedHomeScore: number;
    predictedAwayScore: number;
    predictedGoalScorer: string | null;
    totalPoints: number;
  } | null;
  token: string;
  highlight?: boolean;
};

export function ParticipantPredictionCard({ game, prediction, token, highlight = false }: ParticipantPredictionCardProps) {
  const hasPrediction = Boolean(prediction);
  const isLocked = new Date() >= new Date(game.startsAtIso);
  const [isEditing, setIsEditing] = useState(!hasPrediction && !isLocked);

  const cardStyle = highlight ? { borderColor: "#0f8a4b" } : undefined;
  const status = getVisualStatus({ hasPrediction, isEditing, isLocked });

  function renderSummary() {
    if (hasPrediction && prediction) {
      return (
        <div className="participant-prediction-summary">
          <div>
            <span className="muted">Placar escolhido</span>
            <strong className="matchup-score">
              <TeamBadge teamName={game.homeTeam} />
              <span>{prediction.predictedHomeScore} x {prediction.predictedAwayScore}</span>
              <TeamBadge teamName={game.awayTeam} />
            </strong>
          </div>
          <div>
            <span className="muted">Jogador para marcar gol</span>
            <strong>{prediction.predictedGoalScorer || "Nenhum jogador informado"}</strong>
          </div>
          <div>
            <span className="muted">Pontos neste jogo</span>
            <strong>{prediction.totalPoints}</strong>
          </div>
        </div>
      );
    }

    return (
      <p className="muted">
        {isLocked ? "Você não registrou palpite para esta partida." : "Preencha seu palpite para esta partida."}
      </p>
    );
  }

  return (
    <article className="card stack participant-game-card" style={cardStyle}>
      <header className="participant-game-header">
        <div>
          <strong className="matchup-line">
            <span>Jogo {game.number}:</span>
            <TeamBadge teamName={game.homeTeam} />
            <span>x</span>
            <TeamBadge teamName={game.awayTeam} />
          </strong>
          <p className="muted compact-text">
            {game.stage} {game.groupName ? `- Grupo ${game.groupName}` : ""} - {game.startsAtLabel} - Horário de Brasília
          </p>
          <p className="muted compact-text">Status do jogo: {game.status}</p>
        </div>
        <span className={`status-pill ${status.className}`}>{status.label}</span>
      </header>

      {!isEditing ? (
        <>
          {renderSummary()}
          {hasPrediction && !isLocked ? (
            <>
              <p className="muted compact-text">Você pode editar até o início da partida.</p>
              <button type="button" className="secondary participant-edit-button" onClick={() => setIsEditing(true)}>
                Editar palpite
              </button>
            </>
          ) : null}
          {!hasPrediction && isLocked ? <p className="muted compact-text">Palpites encerrados para este jogo.</p> : null}
        </>
      ) : (
        <form action={savePrediction} className="stack">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="gameId" value={game.id} />
          <p className="muted compact-text">Palpites abertos até o início da partida.</p>
          <div className="grid-auto">
            <label>
              <span className="team-label">Gols <TeamBadge teamName={game.homeTeam} /></span>
              <input
                name="predictedHomeScore"
                type="number"
                min="0"
                defaultValue={prediction?.predictedHomeScore ?? 0}
                required
              />
            </label>
            <label>
              <span className="team-label">Gols <TeamBadge teamName={game.awayTeam} /></span>
              <input
                name="predictedAwayScore"
                type="number"
                min="0"
                defaultValue={prediction?.predictedAwayScore ?? 0}
                required
              />
            </label>
            <label>
              Escolha 1 jogador para marcar gol
              <input
                name="predictedGoalScorer"
                defaultValue={prediction?.predictedGoalScorer ?? ""}
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
          <div className="participant-form-actions">
            <button type="submit">{hasPrediction ? "Salvar alterações" : "Salvar palpite"}</button>
            {hasPrediction ? (
              <button type="button" className="secondary" onClick={() => setIsEditing(false)}>
                Cancelar edição
              </button>
            ) : null}
          </div>
        </form>
      )}
    </article>
  );
}

function getVisualStatus({
  hasPrediction,
  isEditing,
  isLocked
}: {
  hasPrediction: boolean;
  isEditing: boolean;
  isLocked: boolean;
}) {
  if (isEditing) return { label: "Editando palpite", className: "status-warning" };
  if (isLocked) return { label: "Palpites encerrados", className: "status-blocked" };
  if (hasPrediction) return { label: "Palpite salvo", className: "status-paid" };
  return { label: "Nenhum palpite registrado", className: "status-ended" };
}
