'use strict';

const fs = require('fs');
const https = require('https');

const app = require('./app');
const { backendPort } = require('./config');
const { initializeDatabase, closePool } = require('./db');

const CERTIFICATE_PATH = '/home/arx-app/backends/certs/certificate.crt';
const PRIVATE_KEY_PATH = '/home/arx-app/backends/certs/private.key';
const SHUTDOWN_TIMEOUT_MS = 10_000;

let server = null;
let shuttingDown = false;
let shutdownPromise = null;

function getSafeErrorCode(error) {
  if (
    error &&
    typeof error.code === 'string' &&
    /^[A-Z0-9_]+$/.test(error.code)
  ) {
    return error.code;
  }

  return null;
}

function logFailure(context, error) {
  const code = getSafeErrorCode(error);
  console.error(
    `[bookpublishing-api] ${context}${code ? ` (${code})` : ''}.`
  );
}

function closeHttpsServer() {
  if (!server) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(forceCloseTimer);
      resolve();
    };

    const forceCloseTimer = setTimeout(() => {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }

      finish();
    }, SHUTDOWN_TIMEOUT_MS);

    forceCloseTimer.unref();

    try {
      server.close(finish);
    } catch (error) {
      finish();
    }
  });
}

function shutdown(reason, exitCode = 0) {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  shuttingDown = true;
  console.log(`[bookpublishing-api] Shutting down: ${reason}.`);

  shutdownPromise = (async () => {
    await closeHttpsServer();

    try {
      await closePool();
    } catch (error) {
      logFailure('Failed to close the PostgreSQL pool cleanly', error);
      exitCode = 1;
    }

    process.exit(exitCode);
  })();

  return shutdownPromise;
}

async function start() {
  await initializeDatabase();

  if (shuttingDown) {
    return;
  }

  const [certificate, privateKey] = await Promise.all([
    fs.promises.readFile(CERTIFICATE_PATH),
    fs.promises.readFile(PRIVATE_KEY_PATH),
  ]);

  if (shuttingDown) {
    return;
  }

  server = https.createServer(
    {
      cert: certificate,
      key: privateKey,
    },
    app
  );

  await new Promise((resolve, reject) => {
    const handleStartupError = (error) => {
      reject(error);
    };

    server.once('error', handleStartupError);

    server.listen(backendPort, () => {
      server.removeListener('error', handleStartupError);
      resolve();
    });
  });

  server.on('error', (error) => {
    logFailure('HTTPS server failure', error);
    void shutdown('HTTPS server failure', 1);
  });

  console.log(
    `[bookpublishing-api] HTTPS API listening on port ${backendPort}.`
  );
}

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

start().catch((error) => {
  logFailure('Startup failed', error);
  void shutdown('startup failure', 1);
});