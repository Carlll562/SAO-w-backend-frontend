const { getMongoDb } = require('../config/db');

const AuditModel = {
    logAction: async (category, data) => {
        try {
            const db = getMongoDb();
            
            // Mapping categories to specific collection names
            const collections = {
                enrollment: 'enrollment_logs',
                grade: 'grade_logs',
                system: 'system_logs'
            };

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