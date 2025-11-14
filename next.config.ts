import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    reactStrictMode: false,
    experimental: {
        optimizePackageImports: ['@phosphor-icons/react'],
    },
}

export default nextConfig
