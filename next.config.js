
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/localhost:3000\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https?:.*\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https?:.*\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https?:.*\.(?:json)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'json-cache',
        expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
  fallbacks: {
    document: '/offline.html',
    image: '/icons/icon-192x192.png',
  },
});

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  trailingSlash: true,
};

module.exports = withPWA(nextConfig);
