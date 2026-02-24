const app = require('./app');
const { connectDatabases } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Connect to both Databases first, then start the Express server
connectDatabases().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
});