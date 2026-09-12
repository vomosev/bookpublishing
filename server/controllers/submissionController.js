const { query } = require('../db');
const { validateSubmission } = require('../utils/validation');

function mapSubmission(row) {
  return {
    id: row.id,
    title: row.title,
    genre: row.genre,
    wordCount: row.word_count,
    synopsis: row.synopsis,
    manuscriptUrl: row.manuscript_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getValidationErrors(result) {
  if (result === false) {
    return ['The manuscript proposal is invalid.'];
  }

  if (typeof result === 'string' && result.trim()) {
    return [result.trim()];
  }

  if (Array.isArray(result)) {
    return result.filter(Boolean);
  }

  if (!result || typeof result !== 'object') {
    return [];
  }

  if (result.valid === false || result.isValid === false) {
    if (Array.isArray(result.errors)) {
      return result.errors.filter(Boolean);
    }

    if (result.errors && typeof result.errors === 'object') {
      return Object.values(result.errors).filter(Boolean);
    }

    if (result.error) {
      return [result.error];
    }

    return ['The manuscript proposal is invalid.'];
  }

  if (Array.isArray(result.errors) && result.errors.length > 0) {
    return result.errors.filter(Boolean);
  }

  if (
    result.errors &&
    typeof result.errors === 'object' &&
    Object.keys(result.errors).length > 0
  ) {
    return Object.values(result.errors).filter(Boolean);
  }

  return [];
}

async function createSubmission(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const proposal = {
      title: typeof body.title === 'string' ? body.title.trim() : '',
      genre: typeof body.genre === 'string' ? body.genre.trim() : '',
      wordCount: Number(body.wordCount),
      synopsis: typeof body.synopsis === 'string' ? body.synopsis.trim() : '',
      manuscriptUrl:
        typeof body.manuscriptUrl === 'string'
          ? body.manuscriptUrl.trim()
          : '',
    };

    const validationResult = validateSubmission(proposal);
    const validationErrors = getValidationErrors(validationResult);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Please correct the manuscript proposal fields.',
        details: validationErrors,
      });
    }

    const result = await query(
      `INSERT INTO submissions
        (user_id, title, genre, word_count, synopsis, manuscript_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'received')
       RETURNING
        id,
        title,
        genre,
        word_count,
        synopsis,
        manuscript_url,
        status,
        created_at,
        updated_at`,
      [
        userId,
        proposal.title,
        proposal.genre,
        proposal.wordCount,
        proposal.synopsis,
        proposal.manuscriptUrl,
      ],
    );

    return res.status(201).json({
      submission: mapSubmission(result.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
}

async function listOwnSubmissions(req, res, next) {
  try {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const result = await query(
      `SELECT
        id,
        title,
        genre,
        word_count,
        synopsis,
        manuscript_url,
        status,
        created_at,
        updated_at
       FROM submissions
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC`,
      [userId],
    );

    return res.status(200).json({
      submissions: result.rows.map(mapSubmission),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createSubmission,
  listOwnSubmissions,
};