import type { Metadata } from "next";
import "@/assets/globals.css";
import { AuthProvider } from "@/features/auth/auth-context";

export const metadata: Metadata = {
  title: {
    default: "Reborestampa — Estamparia Têxtil",
    template: "%s · Reborestampa",
  },
  description:
    "Estamparia à peça desde 1992, em Vila das Aves. Lacas, foil, borracha, plastisol, glitter e base de água, até 12 cores, para clientes nacionais e internacionais.",
  applicationName: "Reborestampa",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body className="min-h-dvh bg-paper font-sans text-ink antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
