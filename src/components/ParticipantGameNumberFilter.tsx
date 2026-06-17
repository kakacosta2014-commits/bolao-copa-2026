"use client";

import { useMemo, useState } from "react";
import { ParticipantPredictionCard } from "@/components/ParticipantPredictionCard";

type FilterGame = {
  id: string;
  number: number;
  stage: string;
  groupName: string | null;
  homeTeam: string;
  awayTeam: string;
  startsAtIso: string;
  startsAtLabel: string;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
};

type FilterPrediction = {
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedGoalScorer: string | null;
  totalPoints: number;
} | null;

type FilterGameItem = {
  game: FilterGame;
  prediction: FilterPrediction;
  highlight: boolean;
};

export function ParticipantGameNumberFilter({
  token,
  games,
  emptyMessage
}: {
  token: string;
  games: FilterGameItem[];
  emptyMessage: string;
}) {
  const [gameNumber, setGameNumber] = useState("");
  const normalizedGameNumber = gameNumber.trim();
  const filteredGames = useMemo(() => {
    if (!normalizedGameNumber) return games;
    const parsedGameNumber = Number(normalizedGameNumber);
    if (!Number.isInteger(parsedGameNumber)) return [];
    return games.filter((item) => item.game.number === parsedGameNumber);
  }, [games, normalizedGameNumber]);

  const hasFilter = normalizedGameNumber.length > 0;
  const message = hasFilter
    ? "Nenhum jogo encontrado com esse numero nesta secao."
    : emptyMessage;

  return (
    <>
      <div className="card participant-game-filter">
        <label>
          <span>Buscar por numero do jogo</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Ex: 25"
            value={gameNumber}
            onChange={(event) => setGameNumber(event.target.value)}
          />
        </label>
        {hasFilter ? (
          <button type="button" className="secondary" onClick={() => setGameNumber("")}>
            Limpar
          </button>
        ) : null}
      </div>

      {filteredGames.map((item) => (
        <ParticipantPredictionCard
          key={item.game.id}
          token={token}
          game={item.game}
          prediction={item.prediction}
          highlight={item.highlight}
        />
      ))}

      {filteredGames.length === 0 ? <p className="card muted">{message}</p> : null}
    </>
  );
}
