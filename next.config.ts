import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    reactCompiler: true,
    reactStrictMode: false,
    experimental: {
        optimizePackageImports: ['@phosphor-icons/react'],
    },
    webpack: config => {
        // See https://webpack.js.cn/configuration/resolve/#resolvealias
        config.resolve.alias = {
            ...config.resolve.alias,
            sharp$: false,
            'onnxruntime-node$': false,
        }
        return config
    },
}

export default nextConfig
