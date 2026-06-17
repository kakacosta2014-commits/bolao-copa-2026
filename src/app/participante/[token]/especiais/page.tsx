import { ParticipantBackToDashboard } from "@/components/ParticipantBackToDashboard";
import { ParticipantSpecialPredictionsPanel } from "@/components/ParticipantSpecialPredictionsPanel";
import { getParticipantSpecialContext } from "@/lib/participantArea";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ParticipantSpecialPredictionsPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [{ participant, totalPoints }, settings] = await Promise.all([
    getParticipantSpecialContext(token),
    getSettings()
  ]);

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <ParticipantBackToDashboard token={token} />
      <ParticipantSpecialPredictionsPanel
        token={token}
        totalPoints={totalPoints}
        specialPrediction={participant.specialPrediction}
        settings={settings}
      />
    </main>
  );
}
