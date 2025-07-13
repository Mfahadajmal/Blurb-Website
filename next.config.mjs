/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.googleapis.com https://maps.gstatic.com https://*.gstatic.com https://i.ibb.co; connect-src 'self' https://identitytoolkit.googleapis.com https://firestore.googleapis.com https://securetoken.googleapis.com https://*.googleapis.com https://api.stripe.com https://maps.googleapis.com https://api.imgbb.com; frame-src https://js.stripe.com https://hooks.stripe.com;"
          }
        ]
      }
    ]
  }
}

export default nextConfig
