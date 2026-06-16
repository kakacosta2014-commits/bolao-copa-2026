"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PublicHeader() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isParticipant = pathname.startsWith("/participante");

  if (isAdmin) return null;

  return (
    <header className="public-header">
      <nav className="container public-nav" aria-label="Navegacao principal">
        <Link href="/" className="public-brand">
          <Image
            src="/logo-bolao-copa-2026.png"
            alt="Bolão Copa 2026"
            width={44}
            height={44}
            className="nav-logo"
            priority
          />
          <span>Bolão Copa 2026</span>
        </Link>
        <div className="public-links">
          <Link href="/regras">Regras</Link>
          <Link href="/ranking">Ranking</Link>
          <Link href="/entrar">Participar</Link>
          {!isParticipant ? <Link href="/admin" className="public-admin-link">Admin</Link> : null}
        </div>
      </nav>
    </header>
  );
}
