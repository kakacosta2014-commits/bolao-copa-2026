import { AdminNav } from "@/components/AdminNav";
import { MessageBanner } from "@/components/MessageBanner";
import { saveSpecialAdmin } from "@/lib/actions";
import { requireAdmin } from "@/lib/admin";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSpecialsPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requireAdmin();
  const { ok, erro } = await searchParams;
  const settings = await getSettings();

  return (
    <main className="container stack" style={{ padding: "2rem 0", maxWidth: 820 }}>
      <AdminNav />
      <h1>Palpites especiais</h1>
      <MessageBanner ok={ok} erro={erro} />
      <form action={saveSpecialAdmin} className="card stack">
        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            name="specialPredictionsLocked"
            type="checkbox"
            defaultChecked={settings.specialPredictionsLocked}
            style={{ width: "auto" }}
          />
          Bloquear palpites especiais
        </label>
        <label>
          Campeao oficial
          <input name="officialChampion" defaultValue={settings.officialChampion ?? ""} />
        </label>
        <label>
          Artilheiro(s) oficiais
          <textarea
            name="officialTopScorers"
            rows={4}
            defaultValue={settings.officialTopScorers ?? ""}
            placeholder="Separe por virgula, ponto e virgula ou linha"
          />
        </label>
        <button type="submit">Salvar e recalcular especiais</button>
      </form>
    </main>
  );
}
