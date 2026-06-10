import Link from "next/link";
import { logoutAdmin } from "@/lib/actions";

export function AdminNav() {
  return (
    <div className="card" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      <Link href="/admin">Dashboard</Link>
      <Link href="/admin/participantes">Participantes</Link>
      <Link href="/admin/jogos">Jogos</Link>
      <Link href="/admin/resultados">Resultados</Link>
      <Link href="/admin/especiais">Especiais</Link>
      <Link href="/admin/configuracoes">Configuracoes</Link>
      <form action={logoutAdmin} style={{ marginLeft: "auto" }}>
        <button className="secondary" type="submit">Sair</button>
      </form>
    </div>
  );
}
