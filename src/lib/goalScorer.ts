const multipleGoalScorerPattern = /[,;/|]|\s+e\s+/i;

export function hasMultipleGoalScorers(value?: string | null) {
  return multipleGoalScorerPattern.test(String(value ?? "").trim());
}

export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function parseGoalScorerAliases(input: string | string[]) {
  const lines = Array.isArray(input) ? input : [input];

  return lines
    .flatMap((line) => String(line ?? "").split(/\r?\n|[;,]+/))
    .map((line) =>
      line
        .split("|")
        .map(normalizePlayerName)
        .filter(Boolean)
    )
    .filter((aliases) => aliases.length > 0);
}

export function matchesGoalScorerAlias(
  predictedGoalScorer: string | null | undefined,
  goalScorers: string[]
) {
  const predicted = normalizePlayerName(predictedGoalScorer ?? "");
  if (!predicted) return false;

  return parseGoalScorerAliases(goalScorers).some((aliases) => aliases.includes(predicted));
}
