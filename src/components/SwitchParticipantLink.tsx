"use client";

import Link from "next/link";

export function SwitchParticipantLink() {
  function clearSavedParticipant() {
    localStorage.removeItem("bolao_access_token");
  }

  return (
    <Link className="button secondary switch-participant-link" href="/entrar" onClick={clearSavedParticipant}>
      Trocar participante
    </Link>
  );
}
