/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Garde ça, c'est utile pour tes tests
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Autorise les images Supabase
      },
    ],
  },
  // C'est ICI qu'il faut mettre la limite, dans "experimental"
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;