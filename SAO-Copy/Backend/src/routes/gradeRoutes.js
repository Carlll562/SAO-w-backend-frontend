const express = require('express');
const router = express.Router();
const { updateStudentGrade } = require('../controllers/gradeController');
const { protect } = require('../middleware/authMiddleware');

// Changed from .put('/update') to .post('/')
router.post('/', protect(['registrar', 'faculty']), updateStudentGrade);

module.exports = router;