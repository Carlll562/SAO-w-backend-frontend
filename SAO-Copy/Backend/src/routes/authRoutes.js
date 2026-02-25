const express = require('express');
const router = express.Router();

const { login, register } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public login endpoint for frontend
router.post('/login', login);

// Protected registration endpoint; only registrar (admin) can create accounts
router.post('/register', protect(['registrar']), register);

module.exports = router;

