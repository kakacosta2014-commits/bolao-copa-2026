import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolao da Copa dos Amigos",
  description: "MVP privado para palpites da Copa do Mundo."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <header style={{ background: "#ffffff", borderBottom: "1px solid #e7ebf2" }}>
          <nav
            className="container"
            style={{
              minHeight: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap"
            }}
          >
            <Link href="/" style={{ fontWeight: 900 }}>
              Bolao da Copa dos Amigos
            </Link>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontWeight: 700 }}>
              <Link href="/regras">Regras</Link>
              <Link href="/ranking">Ranking</Link>
              <Link href="/entrar">Participar</Link>
              <Link href="/admin">Admin</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
