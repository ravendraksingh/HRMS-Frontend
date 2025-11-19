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
};

export default nextConfig;
