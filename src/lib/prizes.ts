export type PrizePercentages = {
  organizerPrizePercent: number;
  firstPrizePercent: number;
  secondPrizePercent: number;
  thirdPrizePercent: number;
};

export function calculatePrizes(
  paidParticipants: number,
  entryFee: number,
  percentages: PrizePercentages
) {
  const total = paidParticipants * entryFee;

  return {
    paidParticipants,
    total,
    organizer: (total * percentages.organizerPrizePercent) / 100,
    firstPlace: (total * percentages.firstPrizePercent) / 100,
    secondPlace: (total * percentages.secondPrizePercent) / 100,
    thirdPlace: (total * percentages.thirdPrizePercent) / 100,
    percentages
  };
}

export function calculatePrizeCents(totalCents: number, percentage: number) {
  return Math.round((totalCents * percentage) / 100);
}
