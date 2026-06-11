export function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

  return { start, end };
}

export function isGameToday(startsAt: Date) {
  const { start, end } = getTodayRange();
  return startsAt >= start && startsAt < end;
}

export function canPredict(startsAt: Date) {
  return new Date() < startsAt;
}
