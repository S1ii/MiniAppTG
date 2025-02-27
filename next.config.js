/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/ws',
        destination: 'http://127.0.0.1:3001/ws'
      }
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['gossipbot.social', 'www.gossipbot.social'],
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Accept, Content-Type' },
          { key: 'X-Next-Server', value: 'true' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
  poweredByHeader: false,
};

module.exports = nextConfig; 