import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on"
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block"
  }
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  pageExtensions: ["tsx", "ts"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/landing", permanent: true },
      { source: "/admin.html", destination: "/settings", permanent: true },
      { source: "/diagnostico.html", destination: "/diagnostics", permanent: true },
      { source: "/dividas.html", destination: "/debts", permanent: true },
      { source: "/gastos.html", destination: "/expenses", permanent: true },
      { source: "/metas.html", destination: "/goals", permanent: true },
      { source: "/plano.html", destination: "/plan", permanent: true },
      { source: "/fgts.html", destination: "/fgts", permanent: true },
      { source: "/pages/diagnostico.html", destination: "/diagnostics", permanent: true },
      { source: "/pages/index.html", destination: "/landing", permanent: true },
      { source: "/pages/dividas.html", destination: "/debts", permanent: true },
      { source: "/pages/gastos.html", destination: "/expenses", permanent: true },
      { source: "/pages/metas.html", destination: "/goals", permanent: true },
      { source: "/pages/plano.html", destination: "/plan", permanent: true },
      { source: "/pages/fgts.html", destination: "/fgts", permanent: true },
      { source: "/pages/admin.html", destination: "/settings", permanent: true }
    ];
  }
};

export default nextConfig;
