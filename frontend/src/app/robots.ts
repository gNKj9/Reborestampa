import type { MetadataRoute } from "next";

// Necessário para `output: "export"`: a rota é resolvida em build time.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/painel", "/login"],
      },
    ],
  };
}
