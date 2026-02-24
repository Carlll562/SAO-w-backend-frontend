const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const reportRoutes = require('./routes/reportRoutes');

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
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// TEMP: Login bypass to get a token
app.post('/api/v1/auth/test-login', (req, res) => {
    // Simulating a Registrar user login
    const token = jwt.sign(
        { id: 1, name: 'Admin_Registrar', role: 'registrar' }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
    );
    res.json({ token });
});

app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/grades', gradeRoutes);
app.use('/api/v1/reports', reportRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("--- SERVER ERROR DETECTED ---");
    console.error(err); // This will print the filename and line number to the terminal
    console.error("-----------------------------");

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

module.exports = app;