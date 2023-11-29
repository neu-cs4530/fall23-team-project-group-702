/** @type {import('next').NextConfig} */

const nextConfig = {
    /* REQUIRED IN ORDER TO USE @Spotify-web-api-ts-sdk IN PRODUCTION */
typescript: {
    ignoreBuildErrors: true,
    },
}

module.exports = nextConfig