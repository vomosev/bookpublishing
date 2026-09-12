'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');

const {
  sessionSecret,
  sessionCookieName,
  isProduction,
} = require('./config');
const { pool } = require('./db');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PostgreSqlSessionStore = connectPgSimple(session);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    return (
      url.protocol === 'https:' &&
      hostname.endsWith('.geo-drops.com') &&
      hostname.length > '.geo-drops.com'.length &&
      url.username === '' &&
      url.password === ''
    );
  } catch {
    return false;
  }
};

const corsOptions = {
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Accept', 'Content-Type'],
  optionsSuccessStatus: 204,
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error('Origin is not allowed by CORS.');
    error.status = 403;
    callback(error);
  },
};

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb', strict: true }));

app.use(
  session({
    name: sessionCookieName,
    secret: sessionSecret,
    store: new PostgreSqlSessionStore({
      pool,
      tableName: 'session',
      createTableIfMissing: false,
      pruneSessionInterval: 15 * 60,
    }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    },
  })
);

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/submissions', submissionRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use(errorHandler);

module.exports = app;