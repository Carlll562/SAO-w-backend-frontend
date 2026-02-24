const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MySQL Connection Pool (Targeting SAO_DB)
const mysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true, // Prevents idle disconnects
    keepAliveInitialDelay: 10000
});

// MongoDB Connection
const mongoClient = new MongoClient(process.env.MONGO_URI, {
    connectTimeoutMS: 5000, // Wait 5s before failing
    serverSelectionTimeoutMS: 5000
});

let mongoDb;

const connectWithRetry = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            // MySQL
            const connection = await mysqlPool.getConnection();
            console.log(`✅ MySQL Connected: ${process.env.DB_NAME}`);
            connection.release();

            // MongoDB
            await mongoClient.connect();
            mongoDb = mongoClient.db();
            console.log(`✅ MongoDB Connected: ${mongoDb.databaseName}`);

            // Handle MongoDB runtime errors
            mongoClient.on('error', (err) => {
                console.error('❌ MongoDB Runtime Error:', err);
            });

            return; // Success, exit retry loop
        } catch (err) {
            console.error(`⚠️ Connection attempt ${i + 1} failed. Retrying in ${delay/1000}s...`);

            // Specific error messaging
            if (err.code === 'ECONNREFUSED') {
                console.error('   -> Check if your SQL/Mongo services are running.');
            } else if (err.code === 'ER_BAD_DB_ERROR') {
                console.error(`   -> Database "${process.env.DB_NAME}" does not exist. Create it first.`);
            } else {
                console.error(`   -> ${err.message}`);
            }

            if (i === retries - 1) {
                console.error('❌ Max retries reached. Shutting down.');
                process.exit(1);
            }

            await new Promise(res => setTimeout(res, delay));
        }
    }
};

const getMongoDb = () => {
    if (!mongoDb) {
        throw new Error('Attempted to access MongoDB before connection was established.');
    }
    return mongoDb;
};

module.exports = { 
    mysqlPool, 
    connectDatabases: connectWithRetry, // This "aliases" the function so server.js finds it
    getMongoDb 
};