import Link from "next/link";

export function ParticipantBackToDashboard({ token }: { token: string }) {
  return (
    <Link className="button secondary participant-back-button" href={`/participante/${token}`}>
      Voltar ao painel
    </Link>
  );
}
