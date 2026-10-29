import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://reborestampa.onrender.com";

// Necessário para `output: "export"`: a rota é resolvida em build time.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/painel", "/login", "/recuperar", "/redefinir"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
