const express = require('express');
const router = express.Router();

// 1. Import student controller methods
const { addStudent, updateStudent, setArchivedStatus } = require('../controllers/studentController');

// 2. Import the transcript logic from reportController
const { getTranscript } = require('../controllers/reportController');

const { enrollStudent, archiveEnrollment } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect(['registrar']), addStudent);
router.put('/:id', protect(['registrar']), updateStudent);

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

// Delete / Drop Enrollment route
router.patch('/enrollment/:id/archive', protect(['registrar']), (req, res, next) => {
    req.body.isArchived = true;
    archiveEnrollment(req, res, next);
});

router.patch('/enrollment/:id/restore', protect(['registrar']), (req, res, next) => {
    req.body.isArchived = false;
    archiveEnrollment(req, res, next);
});

router.get('/:id/transcript', protect(['registrar', 'faculty']), getTranscript);

module.exports = router;