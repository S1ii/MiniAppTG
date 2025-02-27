module.exports = {
  apps: [
    {
      name: 'gossipbot-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NODE_ENV: 'production',
      },
    },
    {
      name: 'gossipbot-telegram',
      script: 'python_bot/main.py',
      interpreter: './venv/bin/python3',
      env: {
        NODE_ENV: 'production',
      },
    }
  ],
} 