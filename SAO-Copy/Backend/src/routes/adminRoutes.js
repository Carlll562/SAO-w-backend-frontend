const express = require('express');
const router = express.Router();
const { createCourse, createProgram, createCurriculumEntry } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// All administrative routes protected for 'registrar' role
router.post('/courses', protect(['registrar']), createCourse);
router.post('/programs', protect(['registrar']), createProgram);
router.post('/curriculum', protect(['registrar']), createCurriculumEntry);

module.exports = router;