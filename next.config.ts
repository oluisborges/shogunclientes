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
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: allow self + Next.js inline runtime
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: allow self + inline (Tailwind generates inline styles)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: allow self + data URIs + Supabase storage + Facebook/Instagram CDN
      "img-src 'self' data: blob: https://*.supabase.co https://www.facebook.com https://graph.facebook.com https://*.fbcdn.net https://*.cdninstagram.com",
      // Iframes: allow Facebook video embeds (plugin uses multiple subdomains internally)
      "frame-src https://*.facebook.com https://www.facebook.com",
      // API connections
      [
        "connect-src 'self'",
        "https://*.supabase.co",
        "https://api.anthropic.com",
        "https://api.openai.com",
        "https://generativelanguage.googleapis.com",
        "https://graph.facebook.com",
        "https://www.googleapis.com",
        "https://ipapi.co",
      ].join(" "),
      // Media: allow video/audio from Facebook CDN (used by the video plugin)
      "media-src 'self' https://*.fbcdn.net https://*.facebook.com",
      // Frames: deny all
      "frame-ancestors 'none'",
      // Forms: only self
      "form-action 'self'",
      // Upgrade insecure requests in production
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join("; "),
  },
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
