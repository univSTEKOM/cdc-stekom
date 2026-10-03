import type { NextConfig } from "next";

// ─── Content Security Policy ──────────────────────────────────────────────────
// Restricts where resources may load from. Hosts listed are the only external
// origins this app legitimately talks to (CDC + TopLoker APIs, image hosts,
// Google Apps Script webhook, WhatsApp deep links).
// React/Turbopack need eval() in dev (HMR, debugging). Production never uses it,
// so only relax script-src outside production.
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // Next.js injects inline runtime/hydration scripts; 'unsafe-inline' is required
  // for it to work. No user-supplied input is ever rendered as a <script>.
  // 'unsafe-eval' is added in development only — see isDev above.
  // www.instagram.com hosts embed.js, dipakai InstagramEmbed untuk pengumuman
  // rekrutmen offline. Script itu memuat asetnya sendiri dari CDN Facebook.
  `script-src 'self' 'unsafe-inline' https://www.instagram.com https://*.cdninstagram.com https://connect.facebook.net${isDev ? " 'unsafe-eval'" : ""}`,
  // Tailwind / Next inject inline <style>; 'unsafe-inline' needed.
  "style-src 'self' 'unsafe-inline'",
  // Images: self + the remote hosts we render (loker posters, VJF banners, stock).
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // XHR/fetch targets — keep tight to the APIs we actually call.
  // pmb.stekom.ac.id: lead tracking dari browser (lib/lead-tracking.ts).
  "connect-src 'self' https://cdc.stekom.ac.id https://toploker.com https://www.instagram.com https://pmb.stekom.ac.id",
  // Form posts (VJF → WhatsApp, applications → Google Apps Script).
  "form-action 'self' https://wa.me https://script.google.com",
  // Nobody may embed us in an <iframe> (clickjacking). Kita sendiri hanya
  // mem-frame Instagram — embed.js menyuntikkan iframe post ke dalam blockquote.
  // Host mengikuti setup yang sudah terbukti jalan di pmb.stekom.ac.id.
  "frame-ancestors 'none'",
  "frame-src 'self' https://www.instagram.com",
  "object-src 'none'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Force HTTPS for 2 years incl. subdomains (only takes effect over HTTPS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Belt-and-suspenders clickjacking protection for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  // Stop MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable powerful APIs we never use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Isolate cross-origin resources.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework version.
  poweredByHeader: false,
  images: {
    // Vercel's Image Optimization quota (Hobby plan) was exhausted, causing all
    // next/image requests to fail with HTTP 402. Serve images as-is instead —
    // our assets are already reasonably sized.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // ─── URL warisan frontend CodeIgniter ─────────────────────────────────────
  // Situs ini dulu dilayani CI dengan pola URL berbeda. URL lama itu masih
  // terindeks Google, dan sejak pindah ke Next.js pengunjung yang mengkliknya
  // mendarat di 404 — otoritas SEO-nya hangus.
  //
  // Ditangani di sini, bukan lewat proxy/middleware: redirects() diperiksa
  // sebelum filesystem, tidak butuh runtime terpisah, dan dokumentasi Next 16
  // sendiri menyarankan menghindari Proxy bila ada opsi lain.
  //
  // permanent: true → 308, status yang membuat mesin pencari mengalihkan
  // peringkat URL lama ke URL baru (bukan sekadar memindahkan pengunjung).
  async redirects() {
    return [
      {
        // Angka di ujung URL lama adalah id halaman daftar CI, bukan id
        // lowongan, jadi tidak ada lowongan spesifik yang bisa dituju —
        // halaman loker daerah itu tujuan terdekat yang masih bermakna.
        source: "/loker-:daerah/daftar/:id(\\d+)",
        destination: "/jobs/in-:daerah",
        permanent: true,
      },
      {
        // Varian tanpa id — justru bentuk inilah yang muncul di hasil pencarian
        // Google ("cdc.stekom.ac.id › daftar").
        source: "/loker-:daerah/daftar",
        destination: "/jobs/in-:daerah",
        permanent: true,
      },
      {
        // Indeks daftar CI tanpa petunjuk daerah sama sekali.
        source: "/daftar",
        destination: "/loker",
        permanent: true,
      },
      {
        // Slug buatan sendiri dari masa data rekrutmen offline masih mock;
        // sekarang slug mengikuti API rekrutmen.stekom.ac.id.
        source: "/event/walk-in-interview-pt-artha-abadi-batch-23",
        destination: "/event/rekrutmen-pt-inti-artha-abadi-20260828100808",
        permanent: true,
      },
    ];
  },
  // Standalone output for Docker/VPS deployment (Dokploy).
  output: "standalone",
};

export default nextConfig;
