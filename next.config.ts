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
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
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
            },
            {
                protocol: 'https',
                hostname: 'www.transparenttextures.com',
            }
        ],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: `default-src 'self'; script-src ${scriptSrc.join(' ')}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data: https://firebasestorage.googleapis.com https://images.unsplash.com https://api.dicebear.com https://ui-avatars.com https://www.transparenttextures.com; connect-src 'self' https://vitals.vercel-insights.com https://*.firebaseio.com https://*.googleapis.com https://api.stripe.com; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';`,
                    }
                ],
            },
        ];
    },
    webpack: (config) => {
        config.ignoreWarnings = [
            { module: /@protobufjs\/inquire/ },
            { module: /protobufjs/ }
        ];
        return config;
    },
};

export default nextConfig;
