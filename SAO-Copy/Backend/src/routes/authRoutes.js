const express = require('express');
const router = express.Router();

const { login, register, listUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public login endpoint for frontend
router.post('/login', login);

// Protected registration endpoint; only registrar (admin) can create accounts
router.post('/register', protect(['registrar']), register);

// Protected users listing for User Management UI
router.get('/users', protect(['registrar']), listUsers);

module.exports = router;

