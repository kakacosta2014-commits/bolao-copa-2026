"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAdmin } from "@/lib/actions";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/participantes", label: "Participantes" },
  { href: "/admin/palpites", label: "Palpites" },
  { href: "/admin/resultados", label: "Resultados" },
  { href: "/admin/jogos", label: "Jogos" },
  { href: "/admin/especiais", label: "Especiais" },
  { href: "/admin/configuracoes", label: "Configurações" }
];

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="card admin-nav" aria-label="Menu administrativo">
      <div className="admin-nav-top">
        <strong>Painel Admin</strong>
        <button
          type="button"
          className="secondary admin-menu-button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          Menu
        </button>
      </div>
      <div className={`admin-nav-links ${open ? "is-open" : ""}`}>
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={isActiveAdminLink(pathname, link.href) ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <form action={logoutAdmin}>
          <button className="secondary" type="submit">Sair</button>
        </form>
      </div>
    </nav>
  );
}

function isActiveAdminLink(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
