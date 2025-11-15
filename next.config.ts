import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    reactCompiler: true,
    reactStrictMode: false,
    experimental: {
        optimizePackageImports: ['@phosphor-icons/react'],
    },
}

export default nextConfig
