"use client";

import { useState } from "react";

export function CopyAccessLink({ path, absoluteUrl }: { path: string; absoluteUrl?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(absoluteUrl ?? `${window.location.origin}${path}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copyLink} className="secondary">
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}
