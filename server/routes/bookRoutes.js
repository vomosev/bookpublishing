const express = require('express');
const {
  listBooks,
  getBookBySlug,
} = require('../controllers/bookController');

const router = express.Router();

router.get('/', listBooks);
router.get('/:slug', getBookBySlug);

module.exports = router;