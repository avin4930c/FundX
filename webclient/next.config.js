/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config) => {
        config.resolve.fallback = { fs: false, net: false, tls: false };
        return config;
    },
    // Updated experimental options
    experimental: {
        // turbo is used for Turbopack configuration
        turbo: {
            resolveAlias: {
                // Add any Turbopack-specific aliases here if needed
            },
        },
    },
    // Disable image optimization that's not needed
    images: {
        disableStaticImages: true,
    },
};

module.exports = nextConfig;
