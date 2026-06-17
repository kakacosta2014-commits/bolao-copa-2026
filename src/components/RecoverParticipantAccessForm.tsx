import { recoverParticipantAccess } from "@/lib/actions";

export function RecoverParticipantAccessForm() {
  return (
    <form action={recoverParticipantAccess} className="card stack recover-access-card">
      <div className="stack">
        <h2>Ja sou participante?</h2>
        <p className="muted">
          Digite seu nome e WhatsApp cadastrados para acessar novamente seu Bolao.
        </p>
      </div>
      <label>
        Nome completo
        <input name="name" required minLength={3} autoComplete="name" />
      </label>
      <label>
        WhatsApp
        <input name="whatsapp" required placeholder="(00) 00000-0000" autoComplete="tel" />
      </label>
      <p className="muted compact-text">Use os mesmos dados informados no cadastro.</p>
      <button type="submit">Acessar meu bolao</button>
    </form>
  );
}
