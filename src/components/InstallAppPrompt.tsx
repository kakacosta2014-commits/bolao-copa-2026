"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const dismissedKey = "bolao-install-prompt-dismissed";

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean(window.navigator.standalone))
  );
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA install remains optional; registration failure should not block the app.
      });
    }

    if (localStorage.getItem(dismissedKey) === "true" || isStandaloneMode()) {
      return;
    }

    setIsIos(isIosDevice());
    setShowPrompt(true);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setShowPrompt(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  async function installApp() {
    if (!installEvent) return;

    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    dismissPrompt();
  }

  function dismissPrompt() {
    localStorage.setItem(dismissedKey, "true");
    setShowPrompt(false);
  }

  if (!showPrompt) return null;

  return (
    <aside className="install-app-prompt" aria-label="Instalar aplicativo">
      <div>
        <strong>Instale o Bolão no seu celular</strong>
        <p className="muted compact-text">
          Acesse mais rapido pela tela inicial.
        </p>
        {isIos ? (
          <p className="muted compact-text">
            No iPhone, toque em Compartilhar e depois em Adicionar à Tela de Início.
          </p>
        ) : null}
      </div>
      <div className="install-app-actions">
        {installEvent ? (
          <button type="button" onClick={installApp}>
            Instalar app
          </button>
        ) : (
          <span className="muted compact-text">Use o menu do navegador para instalar quando a opção aparecer.</span>
        )}
        <button type="button" className="secondary" onClick={dismissPrompt}>
          Agora não
        </button>
      </div>
    </aside>
  );
}
