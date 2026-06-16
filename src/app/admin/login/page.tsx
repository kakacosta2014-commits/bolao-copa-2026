import Image from "next/image";
import { loginAdmin } from "@/lib/actions";
import { MessageBanner } from "@/components/MessageBanner";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="container stack" style={{ padding: "2rem 0", maxWidth: 520 }}>
      <div className="admin-login-brand">
        <Image
          src="/logo-bolao-copa-2026.png"
          alt="Bolão Copa 2026"
          width={132}
          height={132}
          className="login-logo"
          priority
        />
        <h1>Login do administrador</h1>
      </div>
      <MessageBanner erro={erro} />
      <form action={loginAdmin} className="card stack">
        <label>
          Senha
          <input name="password" type="password" required />
        </label>
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
