import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolao da Copa dos Amigos",
  description: "MVP privado para palpites da Copa do Mundo."
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
