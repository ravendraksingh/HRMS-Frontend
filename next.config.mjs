const nextConfig = {
  /* config options here */
  reactStrictMode: true, // false to disable multitple calls issue
  logging: {
    level: "info",
    colors: true,
    fetches: {
      level: "debug",
      fullUrl: true,
      headers: true,
    },
  },
  webpack: (config, { isServer }) => {
    // Exclude server-only modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
