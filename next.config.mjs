/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "soccer.sincsports.com",
        pathname: "/photos/club/**",
      },
    ],
  },
}

export default nextConfig
