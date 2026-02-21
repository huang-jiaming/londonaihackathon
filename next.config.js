/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig = {
  reactStrictMode: true,
  ...(isStaticExport ? { output: "export" } : {})
};

module.exports = nextConfig;
