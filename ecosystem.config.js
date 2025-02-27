module.exports = {
  apps: [
    {
      name: 'gossipbot-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
    {
      name: 'gossipbot-telegram',
      script: 'dist/bot/index.js',
      env: {
        NODE_ENV: 'production',
      },
    }
  ],
} 