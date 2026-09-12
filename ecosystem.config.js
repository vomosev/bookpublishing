module.exports = {
  apps: [
    {
      name: 'bookpublishing',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/arx-app/backends/bookpublishing',
      env: {
        NODE_ENV: 'production',
        PORT: 5084,
      },
    },
  ],
};