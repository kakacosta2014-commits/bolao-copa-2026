import { ParticipantGameNumberFilter } from "@/components/ParticipantGameNumberFilter";
import { formatDateTime } from "@/lib/format";

type ParticipantGame = {
  id: string;
  number: number;
  stage: string;
  groupName: string | null;
  homeTeam: string;
  awayTeam: string;
  startsAt: Date;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
};

type ParticipantPrediction = {
  gameId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedGoalScorer: string | null;
  totalPoints: number;
};

export function ParticipantGamesSection({
  token,
  title,
  description,
  games,
  predictionByGameId,
  emptyMessage,
  highlightedGameIds = new Set<string>(),
  redirectAfterSave
}: {
  token: string;
  title: string;
  description: string;
  games: ParticipantGame[];
  predictionByGameId: Map<string, ParticipantPrediction>;
  emptyMessage: string;
  highlightedGameIds?: Set<string>;
  redirectAfterSave?: string;
}) {
  const filterGames = games.map((game) => {
    const prediction = predictionByGameId.get(game.id);

    return {
      game: {
        id: game.id,
        number: game.number,
        stage: game.stage,
        groupName: game.groupName,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        startsAtIso: game.startsAt.toISOString(),
        startsAtLabel: formatDateTime(game.startsAt),
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore
      },
      prediction: prediction
        ? {
            predictedHomeScore: prediction.predictedHomeScore,
            predictedAwayScore: prediction.predictedAwayScore,
            predictedGoalScorer: prediction.predictedGoalScorer,
            totalPoints: prediction.totalPoints
          }
        : null,
      highlight: highlightedGameIds.has(game.id)
    };
  });

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <h1>{title}</h1>
          <p className="muted compact-text">{description}</p>
        </div>
      </div>

      <ParticipantGameNumberFilter
        token={token}
        games={filterGames}
        emptyMessage={emptyMessage}
        redirectAfterSave={redirectAfterSave}
      />
    </section>
  );
}
