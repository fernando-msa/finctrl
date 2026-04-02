import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FinCtrl v2",
  description: "Controle financeiro pessoal com segurança e escalabilidade"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
