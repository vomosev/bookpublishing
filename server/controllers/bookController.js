'use strict';

const { query } = require('../db');

function mapBook(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    authorName: row.author_name,
    genre: row.genre,
    description: row.description,
    excerpt: row.excerpt,
    coverTheme: row.cover_theme,
    publicationDate: row.publication_date,
    featured: row.featured,
  };
}

async function listBooks(req, res, next) {
  try {
    const values = [true];
    const conditions = ['published = $1'];

    if (req.query.featured !== undefined) {
      if (
        typeof req.query.featured !== 'string' ||
        !['true', 'false'].includes(req.query.featured.toLowerCase())
      ) {
        return res.status(400).json({
          error: {
            code: 'INVALID_QUERY',
            message: 'The featured query parameter must be true or false.',
          },
        });
      }

      values.push(req.query.featured.toLowerCase() === 'true');
      conditions.push(`featured = $${values.length}`);
    }

    const result = await query(
      `SELECT
         id,
         slug,
         title,
         author_name,
         genre,
         description,
         excerpt,
         cover_theme,
         publication_date,
         featured
       FROM books
       WHERE ${conditions.join(' AND ')}
       ORDER BY featured DESC, publication_date DESC, title ASC`,
      values
    );

    return res.status(200).json({
      books: result.rows.map(mapBook),
    });
  } catch (error) {
    return next(error);
  }
}

async function getBookBySlug(req, res, next) {
  try {
    const slug = String(req.params.slug || '').trim().toLowerCase();

    const result = await query(
      `SELECT
         id,
         slug,
         title,
         author_name,
         genre,
         description,
         excerpt,
         cover_theme,
         publication_date,
         featured
       FROM books
       WHERE slug = $1 AND published = $2
       LIMIT 1`,
      [slug, true]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'BOOK_NOT_FOUND',
          message: 'Book not found.',
        },
      });
    }

    return res.status(200).json({
      book: mapBook(result.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listBooks,
  getBookBySlug,
};