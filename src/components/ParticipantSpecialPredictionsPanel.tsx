import { saveSpecialPrediction } from "@/lib/actions";

type ParticipantSpecialPrediction = {
  championTeam: string;
  topScorerPlayer: string;
} | null;

type SpecialSettings = {
  specialPredictionsLocked: boolean;
};

export function ParticipantSpecialPredictionsPanel({
  token,
  totalPoints,
  specialPrediction,
  settings
}: {
  token: string;
  totalPoints: number;
  specialPrediction: ParticipantSpecialPrediction;
  settings: SpecialSettings;
}) {
  return (
    <section className="card stack">
      <div className="section-heading">
        <h1>Palpites especiais</h1>
        <strong>Seus pontos: {totalPoints}</strong>
      </div>
      <div className="special-summary">
        <div>
          <span className="muted">Campeao escolhido</span>
          <strong>{specialPrediction?.championTeam || "Ainda nao informado"}</strong>
        </div>
        <div>
          <span className="muted">Artilheiro escolhido</span>
          <strong>{specialPrediction?.topScorerPlayer || "Ainda nao informado"}</strong>
        </div>
      </div>
      {settings.specialPredictionsLocked ? (
        <p className="muted">Palpites especiais bloqueados. Suas escolhas ficam travadas para consulta.</p>
      ) : (
        <form action={saveSpecialPrediction} className="grid-auto">
          <input type="hidden" name="token" value={token} />
          <label>
            Campeao
            <input
              name="championTeam"
              defaultValue={specialPrediction?.championTeam ?? ""}
              required
            />
          </label>
          <label>
            Artilheiro
            <input
              name="topScorerPlayer"
              defaultValue={specialPrediction?.topScorerPlayer ?? ""}
              required
            />
          </label>
          <div style={{ alignSelf: "end" }}>
            <button type="submit">Salvar especiais</button>
          </div>
        </form>
      )}
    </section>
  );
}
