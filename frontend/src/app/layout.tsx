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
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "Reborestampa",
    title: "Reborestampa — Estamparia Têxtil",
    description:
      "Estamparia à peça em Vila das Aves, desde 1992. Até 12 cores, em sintéticos e misturas.",
    images: [
      {
        url: "/photos/og.jpg",
        width: 1200,
        height: 630,
        alt: "Produção da Reborestampa — estampagem à peça",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reborestampa — Estamparia Têxtil",
    description: "Estamparia à peça em Vila das Aves, desde 1992.",
    images: ["/photos/og.jpg"],
  },
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
