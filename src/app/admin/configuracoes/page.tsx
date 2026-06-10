import { AdminNav } from "@/components/AdminNav";
import { MessageBanner } from "@/components/MessageBanner";
import { saveSettings } from "@/lib/actions";
import { requireAdmin } from "@/lib/admin";
import { toNumber } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireAdmin();
  const { ok, erro } = await searchParams;
  const settings = await getSettings();

  return (
    <main className="container stack" style={{ padding: "2rem 0", maxWidth: 900 }}>
      <AdminNav />
      <h1>Configuracoes</h1>
      <MessageBanner ok={ok} erro={erro} />
      <form action={saveSettings} className="card stack">
        <div className="grid-auto">
          <label>
            Nome do bolao
            <input name="poolName" defaultValue={settings.poolName} required />
          </label>
          <label>
            Valor de entrada
            <input name="entryFee" type="number" min="0" step="0.01" defaultValue={toNumber(settings.entryFee)} required />
          </label>
          <label>
            Chave PIX
            <input name="pixKey" defaultValue={settings.pixKey} required />
          </label>
          <label>
            Nome do recebedor PIX
            <input name="pixReceiverName" defaultValue={settings.pixReceiverName} required />
          </label>
          <label>
            WhatsApp do organizador
            <input name="organizerWhatsapp" defaultValue={settings.organizerWhatsapp} required />
          </label>
          <label>
            % Organizador
            <input name="organizerPercentage" type="number" min="0" max="100" step="0.01" defaultValue={toNumber(settings.organizerPercentage)} required />
          </label>
          <label>
            % 1o lugar
            <input name="firstPlacePercentage" type="number" min="0" max="100" step="0.01" defaultValue={toNumber(settings.firstPlacePercentage)} required />
          </label>
          <label>
            % 2o lugar
            <input name="secondPlacePercentage" type="number" min="0" max="100" step="0.01" defaultValue={toNumber(settings.secondPlacePercentage)} required />
          </label>
          <label>
            % 3o lugar
            <input name="thirdPlacePercentage" type="number" min="0" max="100" step="0.01" defaultValue={toNumber(settings.thirdPlacePercentage)} required />
          </label>
        </div>
        <p className="muted">A soma dos percentuais precisa ser exatamente 100%.</p>
        <button type="submit">Salvar configuracoes</button>
      </form>
    </main>
  );
}
