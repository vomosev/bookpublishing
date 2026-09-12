'use strict';

function requireAuth(req, res, next) {
  const userId = req.session?.userId;

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(401).json({
      error: 'Authentication required.',
    });
  }

  return next();
}

module.exports = requireAuth;
