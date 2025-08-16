
import type {NextConfig} from 'next';
import withPWAInit from 'next-pwa';

const isProduction = process.env.NODE_ENV === 'production';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !isProduction,
});

const nextConfig: NextConfig = {
  // App Hosting's adapter handles `output: 'standalone'` automatically.
  // We remove 'export' to avoid conflicts with the server build process.
  // output: 'export', 
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
};

// Only wrap with PWA for client-side/export builds, not for the App Hosting server build.
// The presence of `output: 'export'` in the config passed to the adapter can cause issues.
// By not wrapping it, we let the adapter handle the server-side build correctly.
// The build scripts in package.json will still use the PWA wrapper for capacitor builds.
export default nextConfig;
