"use client";

import type { FormEvent } from "react";
import {
  removeAllPendingParticipantsFromDispute,
  removePendingParticipantFromDispute
} from "@/lib/actions";

type RemovePendingDisputeButtonProps =
  | {
      mode: "single";
      participantDisputeId: string;
    }
  | {
      mode: "all";
      disputeId: string;
    };

export function RemovePendingDisputeButton(props: RemovePendingDisputeButtonProps) {
  const isBulkRemoval = props.mode === "all";
  const action = isBulkRemoval
    ? removeAllPendingParticipantsFromDispute
    : removePendingParticipantFromDispute;
  const message = isBulkRemoval
    ? "Tem certeza que deseja remover todos os participantes pendentes desta disputa?"
    : "Tem certeza que deseja remover este participante desta disputa?";
  const buttonLabel = isBulkRemoval
    ? "Remover todos os pendentes desta disputa"
    : "Remover desta disputa";

  function confirmRemoval(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={confirmRemoval} className="participant-dispute-removal-form">
      {props.mode === "all" ? (
        <input type="hidden" name="disputeId" value={props.disputeId} />
      ) : (
        <input type="hidden" name="participantDisputeId" value={props.participantDisputeId} />
      )}
      <button type="submit" className="danger subtle-danger">
        {buttonLabel}
      </button>
    </form>
  );
}
