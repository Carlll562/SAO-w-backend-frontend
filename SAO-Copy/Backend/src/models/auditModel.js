const { getMongoDb } = require('../config/db');

const AuditModel = {
    logAction: async (category, data) => {
        try {
            const db = getMongoDb();
            
            // This acts as your folder routing system
            const collections = {
                'SessionAuth': 'session_logs', // Combines Logins, Logouts, and Session periods into one story
                'Click': 'click_logs',         // Isolates all UI clicks
                'CRUD': 'crud_logs',           // Isolates database changes (create, update, delete)
                'API': 'api_logs',             // Isolates background network requests
                'Error': 'error_logs',         // Isolates system failures
                'enrollment': 'enrollment_logs',
                'grade': 'grade_logs'
            };

            // If a category isn't in the list above, it safely defaults to general_logs
            const collectionName = collections[category] || 'general_logs';
            
            const logEntry = {
                ...data,
                timestamp: new Date()
            };

            await db.collection(collectionName).insertOne(logEntry);
        } catch (err) {
            console.error(`Logging Error [${category}]:`, err);
        }
    }
};

module.exports = AuditModel;