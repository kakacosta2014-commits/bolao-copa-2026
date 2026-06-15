"use client";

import { useMemo, useState } from "react";
import { updateDisputePrizePercentages } from "@/lib/actions";

type PrizePercentagesFormProps = {
  disputeId: string;
  organizerPrizePercent: number;
  firstPrizePercent: number;
  secondPrizePercent: number;
  thirdPrizePercent: number;
};

export function PrizePercentagesForm({
  disputeId,
  organizerPrizePercent,
  firstPrizePercent,
  secondPrizePercent,
  thirdPrizePercent
}: PrizePercentagesFormProps) {
  const [values, setValues] = useState({
    organizerPrizePercent: String(organizerPrizePercent),
    firstPrizePercent: String(firstPrizePercent),
    secondPrizePercent: String(secondPrizePercent),
    thirdPrizePercent: String(thirdPrizePercent)
  });

  const total = useMemo(
    () =>
      Object.values(values).reduce((sum, value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? sum + parsed : sum;
      }, 0),
    [values]
  );
  const totalIsValid = total === 100;

  function updateValue(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <form action={updateDisputePrizePercentages} className="prize-percent-form">
      <input type="hidden" name="disputeId" value={disputeId} />
      <div className="prize-percent-fields">
        <label>
          Organizador %
          <input
            name="organizerPrizePercent"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={values.organizerPrizePercent}
            onChange={(event) => updateValue("organizerPrizePercent", event.target.value)}
          />
        </label>
        <label>
          1o lugar %
          <input
            name="firstPrizePercent"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={values.firstPrizePercent}
            onChange={(event) => updateValue("firstPrizePercent", event.target.value)}
          />
        </label>
        <label>
          2o lugar %
          <input
            name="secondPrizePercent"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={values.secondPrizePercent}
            onChange={(event) => updateValue("secondPrizePercent", event.target.value)}
          />
        </label>
        <label>
          3o lugar %
          <input
            name="thirdPrizePercent"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={values.thirdPrizePercent}
            onChange={(event) => updateValue("thirdPrizePercent", event.target.value)}
          />
        </label>
      </div>
      <div className={`prize-percent-total ${totalIsValid ? "is-valid" : "is-invalid"}`}>
        Soma atual: <strong>{total}%</strong>
      </div>
      {!totalIsValid ? (
        <p className="warning-text">A soma dos percentuais precisa ser 100%.</p>
      ) : null}
      <button type="submit">Salvar percentuais</button>
    </form>
  );
}
