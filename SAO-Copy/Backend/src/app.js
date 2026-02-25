const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const logRoutes = require('./routes/logRoutes'); // <--- 1. ADD THIS IMPORT
const authRoutes = require('./routes/authRoutes');

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// New auth routes backed by MongoDB users
app.use('/api/v1/auth', authRoutes);

// --- ROUTES ---
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/grades', gradeRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/logs', logRoutes); // <--- 2. ADD THIS ROUTE

app.use((err, req, res, next) => {
    console.error("--- SERVER ERROR DETECTED ---");
    console.error(err);
    console.error("-----------------------------");

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

module.exports = app;