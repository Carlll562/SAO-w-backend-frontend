const app = require('./app');
const { connectDatabases } = require('./config/db');

// Initialize database connection
let dbInitialized = false;

// Vercel serverless function handler
module.exports = async (req, res) => {
    if (!dbInitialized) {
        await connectDatabases();
        dbInitialized = true;
    }
    // Pass the request to the Express app
    return app(req, res);
};
