const multipleGoalScorerPattern = /[,;/|]|\s+e\s+/i;

export function hasMultipleGoalScorers(value?: string | null) {
  return multipleGoalScorerPattern.test(String(value ?? "").trim());
}
