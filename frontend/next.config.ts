import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  // "standalone": servidor Next próprio (docker-compose local).
  // "export": HTML estático servido pelo Express (deploy numa só origem).
  output: isStaticExport ? "export" : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Em contentores/CI com limite de PIDs, definir NEXT_BUILD_CPUS=1 evita
  // que os workers de build rebentem por falta de threads do sistema.
  experimental: process.env.NEXT_BUILD_CPUS
    ? { cpus: Number(process.env.NEXT_BUILD_CPUS) }
    : undefined,
  images: { unoptimized: true },

  // `headers()` não é suportado com output: "export" — nesse modo os headers
  // são aplicados pelo Express (ver backend/src/app.ts).
  ...(isStaticExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                {
                  key: "Referrer-Policy",
                  value: "strict-origin-when-cross-origin",
                },
                {
                  key: "Permissions-Policy",
                  value: "camera=(), microphone=(), geolocation=(), payment=()",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
