import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  // Only enable custom webpack config in development
  ...(process.env.NODE_ENV === 'development' && {
    // 禁用 Next.js 热重载，由 nodemon 处理重编译
    reactStrictMode: false,
    webpack: (config, { dev }) => {
      if (dev) {
        // 禁用 webpack 的热模块替换
        config.watchOptions = {
          ignored: ['**/*'], // 忽略所有文件变化
        };
      }
      return config;
    },
  }),
  // Configure for production deployment
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    // Disable image optimization for Vercel compatibility
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
