import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolão Copa 2026",
  description: "Sistema de palpites da Copa 2026 com ranking, disputas e pontuação automática.",
  icons: {
    icon: "/logo-bolao-copa-2026.png",
    apple: "/logo-bolao-copa-2026.png"
  },
  openGraph: {
    title: "Bolão Copa 2026",
    description: "Sistema de palpites da Copa 2026 com ranking, disputas e pontuação automática."
  }
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
