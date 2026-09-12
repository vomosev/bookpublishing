'use strict';

const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
const { databaseUrl, isProduction } = require('../config');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
      }
    : false,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (error) => {
  console.error(
    'Unexpected PostgreSQL pool error:',
    isProduction ? error.message : error
  );
});

let initializationPromise = null;
let closePromise = null;

function query(text, params) {
  return pool.query(text, params);
}

async function runSchemaInitialization() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');

  if (!schemaSql.trim()) {
    throw new Error('Database schema file is empty.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error(
        'Failed to roll back database initialization:',
        isProduction ? rollbackError.message : rollbackError
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

function initializeDatabase() {
  if (!initializationPromise) {
    initializationPromise = runSchemaInitialization().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

function closePool() {
  if (!closePromise) {
    closePromise = pool.end();
  }

  return closePromise;
}

module.exports = {
  pool,
  query,
  initializeDatabase,
  closePool,
};