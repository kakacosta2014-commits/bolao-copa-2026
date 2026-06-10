export type MatchResult = "HOME" | "AWAY" | "DRAW";

export type GameScoreInput = {
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedGoalScorer?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  goalScorers: string[];
};

export type GamePoints = {
  scorePoints: number;
  resultPoints: number;
  goalScorerPoints: number;
  totalPoints: number;
};

export type SpecialPoints = {
  championPoints: number;
  topScorerPoints: number;
  totalPoints: number;
};

export type RankingParticipant = {
  id: string;
  name: string;
  gamePoints: number;
  championPoints: number;
  topScorerPoints: number;
  totalPoints: number;
  exactScores: number;
  correctResults: number;
  goalScorers: number;
};

export function getMatchResult(homeScore: number, awayScore: number): MatchResult {
  if (homeScore > awayScore) return "HOME";
  if (awayScore > homeScore) return "AWAY";
  return "DRAW";
}

export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function calculateGamePredictionPoints(input: GameScoreInput): GamePoints {
  if (input.homeScore === null || input.awayScore === null) {
    return { scorePoints: 0, resultPoints: 0, goalScorerPoints: 0, totalPoints: 0 };
  }

  const exact =
    input.predictedHomeScore === input.homeScore &&
    input.predictedAwayScore === input.awayScore;
  const resultCorrect =
    getMatchResult(input.predictedHomeScore, input.predictedAwayScore) ===
    getMatchResult(input.homeScore, input.awayScore);
  const predictedScorer = input.predictedGoalScorer
    ? normalizePlayerName(input.predictedGoalScorer)
    : "";
  const normalizedScorers = input.goalScorers.map(normalizePlayerName);

  const scorePoints = exact ? 10 : 0;
  const resultPoints = !exact && resultCorrect ? 5 : 0;
  const goalScorerPoints =
    predictedScorer && normalizedScorers.includes(predictedScorer) ? 5 : 0;

  return {
    scorePoints,
    resultPoints,
    goalScorerPoints,
    totalPoints: scorePoints + resultPoints + goalScorerPoints
  };
}

export function calculateSpecialPoints(
  championTeam: string,
  topScorerPlayer: string,
  officialChampion?: string | null,
  officialTopScorers?: string | null
): SpecialPoints {
  const championPoints =
    officialChampion &&
    normalizePlayerName(championTeam) === normalizePlayerName(officialChampion)
      ? 20
      : 0;

  const officialScorers = (officialTopScorers ?? "")
    .split(/[;\n,]+/)
    .map(normalizePlayerName)
    .filter(Boolean);
  const topScorerPoints = officialScorers.includes(normalizePlayerName(topScorerPlayer))
    ? 20
    : 0;

  return {
    championPoints,
    topScorerPoints,
    totalPoints: championPoints + topScorerPoints
  };
}

export function calculateRanking(participants: RankingParticipant[]): RankingParticipant[] {
  return [...participants].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
    if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export function calculatePrizes(
  paidParticipants: number,
  entryFee: number,
  percentages: {
    organizerPercentage: number;
    firstPlacePercentage: number;
    secondPlacePercentage: number;
    thirdPlacePercentage: number;
  }
) {
  const total = paidParticipants * entryFee;

  return {
    paidParticipants,
    total,
    organizer: (total * percentages.organizerPercentage) / 100,
    firstPlace: (total * percentages.firstPlacePercentage) / 100,
    secondPlace: (total * percentages.secondPlacePercentage) / 100,
    thirdPlace: (total * percentages.thirdPlacePercentage) / 100
  };
}
