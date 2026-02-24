const express = require('express');
const router = express.Router();

// 1. Import student controller methods
const { addStudent, updateStudent, setArchivedStatus } = require('../controllers/studentController');

// 2. Import the transcript logic from reportController
const { getTranscript } = require('../controllers/reportController');

const { enrollStudent } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/authMiddleware');

// Only users with the 'registrar' role can POST new students
router.post('/', protect(['registrar']), addStudent);

// Update existing student (no ID change)
router.put('/:id', protect(['registrar']), updateStudent);

// Archive / Restore Student (soft delete via Is_Archived flag)
router.patch('/:id/archive', protect(['registrar']), (req, res, next) => {
    req.body.archived = true;
    setArchivedStatus(req, res, next);
});

router.patch('/:id/restore', protect(['registrar']), (req, res, next) => {
    req.body.archived = false;
    setArchivedStatus(req, res, next);
});

// Enrollment Route
router.post('/enroll', protect(['registrar']), enrollStudent);

// Transcript Route (Now pointing to the reportController logic)
router.get('/:id/transcript', protect(['registrar', 'faculty']), getTranscript);

module.exports = router;