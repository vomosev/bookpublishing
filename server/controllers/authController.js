const bcrypt = require('bcrypt');
const { query } = require('../db/index.js');
const {
  sessionCookieName,
  isProduction,
} = require('../config.js');
const {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateDisplayName,
} = require('../utils/validation.js');

const PASSWORD_HASH_ROUNDS = 12;

function sanitizeUser(user) {
  return {
    id: user.id,
    displayName: user.display_name,
    email: user.email,
  };
}

function getClearCookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };
}

function regenerateSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        reject(regenerateError);
        return;
      }

      req.session.userId = userId;

      req.session.save((saveError) => {
        if (saveError) {
          reject(saveError);
          return;
        }

        resolve();
      });
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function signup(req, res, next) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const rawDisplayName = body.displayName ?? body.name;
    const displayName =
      typeof rawDisplayName === 'string' ? rawDisplayName.trim() : '';
    const email =
      typeof body.email === 'string' ? normalizeEmail(body.email) : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!validateDisplayName(displayName)) {
      return res.status(400).json({
        error: 'Please provide a valid author name.',
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address.',
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error:
          'Password does not meet the required length and security requirements.',
      });
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email],
    );

    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        error: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

    let result;

    try {
      result = await query(
        `INSERT INTO users (display_name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, display_name, email`,
        [displayName, email, passwordHash],
      );
    } catch (error) {
      if (error && error.code === '23505') {
        return res.status(409).json({
          error: 'An account with this email address already exists.',
        });
      }

      throw error;
    }

    const user = result.rows[0];
    await regenerateSession(req, user.id);

    return res.status(201).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email =
      typeof body.email === 'string' ? normalizeEmail(body.email) : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!validateEmail(email) || !validatePassword(password)) {
      return res.status(400).json({
        error: 'Please provide a valid email address and password.',
      });
    }

    const result = await query(
      `SELECT id, display_name, email, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: 'Invalid email address or password.',
      });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid email address or password.',
      });
    }

    await regenerateSession(req, user.id);

    return res.status(200).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    await destroySession(req);
    res.clearCookie(sessionCookieName, getClearCookieOptions());

    return res.status(200).json({
      message: 'You have been logged out.',
    });
  } catch (error) {
    return next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    if (!req.session || req.session.userId == null) {
      return res.status(401).json({
        error: 'Authentication required.',
      });
    }

    const result = await query(
      `SELECT id, display_name, email
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.session.userId],
    );

    if (result.rowCount === 0) {
      await destroySession(req);
      res.clearCookie(sessionCookieName, getClearCookieOptions());

      return res.status(401).json({
        error: 'Authentication required.',
      });
    }

    return res.status(200).json({
      user: sanitizeUser(result.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
};