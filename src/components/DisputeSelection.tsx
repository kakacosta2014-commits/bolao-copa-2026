"use client";

import { useMemo, useState } from "react";

type SelectableDispute = {
  id: string;
  name: string;
  description: string | null;
  entryFeeCents: number;
  includesSpecialPredictions: boolean;
  _count: { games: number };
};

function formatCurrencyFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

export function DisputeSelection({
  disputes,
  defaultSelectedIds
}: {
  disputes: SelectableDispute[];
  defaultSelectedIds: string[];
}) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(defaultSelectedIds));
  const selectedDisputes = useMemo(
    () => disputes.filter((dispute) => selectedIds.has(dispute.id)),
    [disputes, selectedIds]
  );
  const totalCents = selectedDisputes.reduce((total, dispute) => total + dispute.entryFeeCents, 0);

  function toggleDispute(disputeId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(disputeId)) {
        next.delete(disputeId);
      } else {
        next.add(disputeId);
      }
      return next;
    });
  }

  return (
    <section className="stack" aria-labelledby="disputas-cadastro">
      <div>
        <h2 id="disputas-cadastro">Escolha suas disputas</h2>
        <p className="muted compact-text">
          Voce pode participar de uma ou mais disputas. Cada disputa tem premiacao e ranking proprios.
        </p>
      </div>

      <div className="signup-dispute-grid">
        {disputes.map((dispute) => {
          const selected = selectedIds.has(dispute.id);

          return (
            <label key={dispute.id} className={`signup-dispute-card ${selected ? "is-selected" : ""}`}>
              <input
                type="checkbox"
                name="disputeIds"
                value={dispute.id}
                checked={selected}
                onChange={() => toggleDispute(dispute.id)}
              />
              <span className="signup-dispute-content">
                <span className="signup-dispute-header">
                  <strong>{dispute.name}</strong>
                  <span className="status-pill">{formatCurrencyFromCents(dispute.entryFeeCents)}</span>
                </span>
                <span className="muted compact-text">{dispute.description ?? "Sem descricao."}</span>
                <span className="participant-dispute-meta">
                  <span>{dispute._count.games} jogos</span>
                  <span>{dispute.includesSpecialPredictions ? "Inclui especiais" : "Sem especiais"}</span>
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {disputes.length === 0 ? (
        <p className="warning-text">Nenhuma disputa ativa esta disponivel no momento.</p>
      ) : null}

      <div className={`signup-dispute-total ${selectedDisputes.length > 0 ? "is-valid" : "is-invalid"}`}>
        <span>{selectedDisputes.length} disputa{selectedDisputes.length === 1 ? "" : "s"} selecionada{selectedDisputes.length === 1 ? "" : "s"}</span>
        <strong>Total a pagar: {formatCurrencyFromCents(totalCents)}</strong>
      </div>

      {selectedDisputes.length === 0 ? (
        <p className="warning-text">Escolha pelo menos uma disputa para participar.</p>
      ) : null}
    </section>
  );
}
