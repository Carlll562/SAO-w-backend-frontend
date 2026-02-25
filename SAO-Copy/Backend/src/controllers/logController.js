const { getMongoDb } = require('../config/db');
const AuditModel = require('../models/auditModel');

const getLogs = async (req, res, next) => {
    const { category } = req.params; 
    
    try {
        const db = getMongoDb();
        
        // Match the URL parameter to the new collection names
        const collectionMap = {
            session: 'session_logs',
            click: 'click_logs',
            crud: 'crud_logs',
            api: 'api_logs',
            error: 'error_logs',
            enrollment: 'enrollment_logs',
            grade: 'grade_logs',
            system: 'system_logs'
        };

        const collectionName = collectionMap[category.toLowerCase()] || 'general_logs';

        const logs = await db.collection(collectionName)
            .find({})
            .sort({ timestamp: -1 }) 
            .toArray();

        res.status(200).json({
            success: true,
            category: category,
            count: logs.length,
            data: logs
        });
    } catch (err) {
        next(err);
    }
};

const createLog = async (req, res, next) => {
    const logData = req.body;
    
    try {
        // Grab the category sent by the frontend (e.g., "Click", "Error", "CRUD")
        let backendCategory = logData.category || 'System';
        
        // As requested: Group "Auth" (Logins/Logouts) and "Session" together
        // so they land in the exact same collection to tell a unified story.
        if (backendCategory === 'Auth' || backendCategory === 'Session') {
            backendCategory = 'SessionAuth';
        }
        
        // Pass it to the model to be saved in the correct collection
        await AuditModel.logAction(backendCategory, logData);

        res.status(201).json({ success: true, message: "Log saved successfully to MongoDB" });
    } catch (err) {
        console.error("Failed to save log:", err);
        res.status(500).json({ success: false, message: "Failed to save log" });
    }
};

module.exports = { getLogs, createLog };