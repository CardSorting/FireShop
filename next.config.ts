import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV !== 'production';
const scriptSrc = [
    "'self'",
    ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
    'https://js.stripe.com',
];

const nextConfig: NextConfig = {
    cleanDistDir: true,
    reactStrictMode: true,
    poweredByHeader: false,
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },

    experimental: {
        optimizePackageImports: ['lucide-react', 'date-fns'],
    },
    compiler: {
        removeConsole: !isDevelopment,
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            }
        ],
    },
};

export default nextConfig;

