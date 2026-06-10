import { prisma } from "@/lib/db";

export const DEFAULT_SETTINGS = {
  poolName: "Bolão da Copa dos Amigos",
  entryFee: 50,
  pixKey: "",
  pixReceiverName: "",
  organizerWhatsapp: "",
  organizerPercentage: 20,
  firstPlacePercentage: 40,
  secondPlacePercentage: 25,
  thirdPlacePercentage: 15,
  specialPredictionsLocked: false
};

export async function getSettings() {
  const current = await prisma.settings.findFirst();
  if (current) return current;
  return prisma.settings.create({ data: DEFAULT_SETTINGS });
}
