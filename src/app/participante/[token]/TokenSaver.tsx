"use client";

import { useEffect } from "react";

export function TokenSaver({ token }: { token: string }) {
  useEffect(() => {
    localStorage.setItem("bolao_access_token", token);
  }, [token]);

  return null;
}
