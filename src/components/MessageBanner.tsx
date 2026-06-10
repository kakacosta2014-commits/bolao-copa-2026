export function MessageBanner({ ok, erro }: { ok?: string; erro?: string }) {
  const message = ok ?? erro;
  if (!message) return null;

  return (
    <div
      className="card"
      style={{
        borderColor: ok ? "#85d8a6" : "#f0a29b",
        background: ok ? "#effaf3" : "#fff1f0",
        color: ok ? "#075f35" : "#8a1f16",
        fontWeight: 800
      }}
    >
      {message}
    </div>
  );
}
