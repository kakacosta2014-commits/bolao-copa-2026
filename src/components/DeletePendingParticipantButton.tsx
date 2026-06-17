"use client";

import type { FormEvent } from "react";
import { deletePendingParticipant } from "@/lib/actions";

type DeletePendingParticipantButtonProps = {
  participantId: string;
  participantName: string;
  redirectTo: "/admin/disputas" | "/admin/participantes";
};

export function DeletePendingParticipantButton({
  participantId,
  participantName,
  redirectTo
}: DeletePendingParticipantButtonProps) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o participante "${participantName}"? Esta acao tambem apagara os palpites dele e nao podera ser desfeita.`
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form action={deletePendingParticipant} onSubmit={confirmDelete} className="delete-pending-participant-form">
      <input type="hidden" name="participantId" value={participantId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button type="submit" className="danger subtle-danger">
        Excluir participante pendente
      </button>
    </form>
  );
}
