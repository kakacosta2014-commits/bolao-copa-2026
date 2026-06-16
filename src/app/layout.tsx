import type { Metadata, Viewport } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolão Copa 2026",
  description: "Sistema de palpites da Copa 2026 com ranking, disputas e pontuação automática.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    title: "Bolão 2026",
    statusBarStyle: "default"
  },
  openGraph: {
    title: "Bolão Copa 2026",
    description: "Sistema de palpites da Copa 2026 com ranking, disputas e pontuação automática."
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Bolão 2026",
    "apple-mobile-web-app-status-bar-style": "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#003b7a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <PublicHeader />
        {children}
      </body>
    </html>
  );
}
