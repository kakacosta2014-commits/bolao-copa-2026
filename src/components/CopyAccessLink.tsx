"use client";

import { useState } from "react";

export function CopyAccessLink({ path, absoluteUrl }: { path: string; absoluteUrl?: string }) {
  const [copied, setCopied] = useState(false);

  function getCopyUrl() {
    const currentUrl = `${window.location.origin}${path}`;
    if (!absoluteUrl) return currentUrl;

    try {
      const configured = new URL(absoluteUrl);
      const current = new URL(window.location.origin);
      if (configured.hostname !== current.hostname) return currentUrl;
      return absoluteUrl;
    } catch {
      return currentUrl;
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(getCopyUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copyLink} className="secondary">
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}
