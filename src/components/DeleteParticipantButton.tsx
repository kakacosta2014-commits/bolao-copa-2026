"use client";

import type { FormEvent } from "react";
import { deleteParticipantAction } from "@/lib/actions";

export function DeleteParticipantButton({ participantId }: { participantId: string }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm("Tem certeza que deseja excluir este participante? Essa ação não pode ser desfeita.");
    if (!confirmed) event.preventDefault();
  }

  return (
    <form action={deleteParticipantAction} onSubmit={confirmDelete}>
      <input type="hidden" name="participantId" value={participantId} />
      <button type="submit" className="danger subtle-danger">
        Excluir
      </button>
    </form>
  );
}
