/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // تصدير ثابت كامل إلى مجلد out/ (متوافق مع استضافة Cloudflare Pages الساكنة)
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;
