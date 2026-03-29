import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  // Prevent browsers from MIME-sniffing away from declared content-type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Enable XSS filter on older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Control referrer info sent with requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser features/APIs
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Force HTTPS for 1 year (production only)
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]),
  // NOTE: Content-Security-Policy is intentionally omitted.
  // The Facebook Video Plugin (used in campaign creative previews) loads from
  // multiple dynamic subdomains that cannot be fully enumerated in a static CSP
  // without breaking the embed. The remaining headers below provide meaningful
  // protection without restricting what the browser can load.
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
