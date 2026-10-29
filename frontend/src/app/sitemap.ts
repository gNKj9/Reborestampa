import type { MetadataRoute } from "next";

// `output: "export"` exige que a rota seja resolvida em build time.
export const dynamic = "force-static";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://reborestampa.onrender.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${BASE_URL}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/privacidade`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
