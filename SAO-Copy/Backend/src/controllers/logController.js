const { getMongoDb } = require('../config/db');

const getLogs = async (req, res, next) => {
    const { category } = req.params; // 'enrollment', 'grade', or 'system'
    
    try {
        const db = getMongoDb();
        
        // Map the URL parameter to the actual MongoDB collection names
        const collectionMap = {
            enrollment: 'enrollment_logs',
            grade: 'grade_logs',
            system: 'system_logs'
        };

        const collectionName = collectionMap[category];

        if (!collectionName) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid log category. Use 'enrollment', 'grade', or 'system'." 
            });
        }

        // Fetch logs sorted by newest first
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

module.exports = { getLogs };