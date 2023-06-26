/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: function (config, { isServer }) {
    // Your other webpack configs

    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    config.resolve.fallback = {
      ...config.resolve.fallback,

      crypto: false,
      stream: false,
      tls: false,
      net: false,
      zlib: false,
      http: false,
      http2: false,
      dns: false,
      os: false,
      fs: false,
      path: false,
      querystring: false,
    };

    return config;
  },
};

module.exports = nextConfig;
