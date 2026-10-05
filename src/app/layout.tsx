import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RestoKonect — Gestion de restaurant",
  description:
    "Caisse, stock et personnel pour les restaurants d'Abidjan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
