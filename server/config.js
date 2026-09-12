'use strict';

require('dotenv').config();

function readRequiredValue(name) {
  const value = process.env[name];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function parseBackendPort(value) {
  if (!/^\d+$/.test(value)) {
    throw new Error('BACKEND_PORT must be a whole number between 1 and 65535.');
  }

  const port = Number(value);

  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('BACKEND_PORT must be a whole number between 1 and 65535.');
  }

  if (port === 3000) {
    throw new Error('BACKEND_PORT must not use reserved port 3000.');
  }

  return port;
}

function validateDatabaseUrl(value) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use the postgres: or postgresql: protocol.');
  }

  if (!parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
    throw new Error('DATABASE_URL must include a host and database name.');
  }

  return value;
}

function validateSessionSecret(value) {
  if (value.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  }

  return value;
}

const backendPort = parseBackendPort(readRequiredValue('BACKEND_PORT'));
const databaseUrl = validateDatabaseUrl(readRequiredValue('DATABASE_URL'));
const sessionSecret = validateSessionSecret(readRequiredValue('SESSION_SECRET'));
const sessionCookieName = 'bookpublishing.sid';
const isProduction = process.env.NODE_ENV === 'production';

module.exports = Object.freeze({
  backendPort,
  databaseUrl,
  sessionSecret,
  sessionCookieName,
  isProduction,
});