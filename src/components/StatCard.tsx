import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="card">
      <div className="muted" style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, marginTop: 6 }}>{value}</div>
      {hint ? <div className="muted" style={{ marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}
