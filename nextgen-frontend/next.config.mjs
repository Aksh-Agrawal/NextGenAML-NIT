/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Suppress build errors from recharts/d3 server-side
  experimental: {
    optimizePackageImports: ["recharts", "lucide-react", "framer-motion"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
