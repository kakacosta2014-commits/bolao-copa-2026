"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ResumeAccess() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("bolao_access_token"));
  }, []);

  if (!token) return null;

  return (
    <Link className="button secondary" href={`/participante/${token}`}>
      Continuar meu acesso
    </Link>
  );
}
