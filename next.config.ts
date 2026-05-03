import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV !== 'production';
const scriptSrc = [
    "'self'",
    ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
    'https://js.stripe.com',
];

const nextConfig: NextConfig = {
    serverExternalPackages: [
        'better-sqlite3',
        'sharp',
        '@grpc/grpc-js',
        '@grpc/proto-loader',
        'undici',
    ],
    async headers() {
        const securityHeaders = [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
            { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
            { key: 'X-DNS-Prefetch-Control', value: 'off' },
            ...(isDevelopment ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
            { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")' },
            {
                key: 'Content-Security-Policy',
                value: [
                    "default-src 'self'",
                    "base-uri 'self'",
                    "frame-ancestors 'none'",
                    "object-src 'none'",
                    "img-src 'self' data: https:",
                    `script-src ${scriptSrc.join(' ')}`,
                    "style-src 'self' 'unsafe-inline'",
                    "connect-src 'self' https://api.stripe.com https://firestore.googleapis.com https://*.firebaseio.com https://*.googleapis.com",
                    "frame-src https://js.stripe.com https://hooks.stripe.com",
                    "form-action 'self'",
                    "upgrade-insecure-requests",
                ].join('; '),
            },
        ];

        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;

