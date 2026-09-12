const express = require('express');

const {
  createSubmission,
  listOwnSubmissions,
} = require('../controllers/submissionController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/', requireAuth, createSubmission);
router.get('/mine', requireAuth, listOwnSubmissions);

module.exports = router;