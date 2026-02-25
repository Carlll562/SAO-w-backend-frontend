const express = require('express');
const router = express.Router();
const { getLogs, createLog } = require('../controllers/logController');

// POST a new log from the frontend
router.post('/', createLog);

// GET logs for the dashboard
router.get('/:category', getLogs);

module.exports = router;