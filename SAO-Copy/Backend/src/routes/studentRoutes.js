const express = require('express');
const router = express.Router();

// 1. Only import addStudent from studentController
const { addStudent } = require('../controllers/studentController');

// 2. Import the transcript logic from reportController
const { getTranscript } = require('../controllers/reportController');

const { enrollStudent } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/authMiddleware');

// Only users with the 'registrar' role can POST new students
router.post('/', protect(['registrar']), addStudent);

// Enrollment Route
router.post('/enroll', protect(['registrar']), enrollStudent);

// Transcript Route (Now pointing to the reportController logic)
router.get('/:id/transcript', protect(['registrar', 'faculty']), getTranscript);

module.exports = router;