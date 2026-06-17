import { ParticipantBackToDashboard } from "@/components/ParticipantBackToDashboard";
import { ParticipantDisputesPanel } from "@/components/ParticipantDisputesPanel";
import { getParticipantDisputesContext } from "@/lib/participantArea";

export const dynamic = "force-dynamic";

export default async function ParticipantDisputesPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { participant, availableDisputes } = await getParticipantDisputesContext(token);

  return (
    <main className="container stack" style={{ padding: "2rem 0" }}>
      <ParticipantBackToDashboard token={token} />
      <ParticipantDisputesPanel
        token={token}
        participantDisputes={participant.disputes}
        availableDisputes={availableDisputes}
      />
    </main>
  );
}
