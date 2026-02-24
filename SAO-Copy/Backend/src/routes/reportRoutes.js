const express = require('express');
const router = express.Router();
const { 
    getTranscript, 
    getDeansList, 
    getStudentGWA 
} = require('../controllers/reportController');
// Import the log controller
const { getLogs } = require('../controllers/logController');
const { protect } = require('../middleware/authMiddleware');

// --- Academic Reports ---

// Route for the Dean's List View
router.get('/deans-list', protect(['registrar', 'faculty']), getDeansList);

// Route for the Transcript View
router.get('/transcript/:id', protect(['registrar', 'faculty']), getTranscript);

// Route for specific GWA calculation
router.get('/gwa/:id', protect(['registrar', 'faculty']), getStudentGWA);

// --- Audit Logs (The Black Box) ---

// Route for MongoDB logs: /api/v1/reports/logs/enrollment, /api/v1/reports/logs/grade, etc.
router.get('/logs/:category', protect(['registrar']), getLogs);

module.exports = router;