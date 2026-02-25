const { mysqlPool } = require('../config/db');

const EnrollmentModel = {
    enroll: async (data) => {
        const query = `CALL StudentEnroll(?, ?, ?, ?, ?)`;
        const values = [
            data.fullName, 
            data.courseCode, 
            data.programName, 
            data.yearId, 
            data.semesterId
        ];
        const [result] = await mysqlPool.execute(query, values);
        
        // Extract the ID returned by SELECT LAST_INSERT_ID() in the procedure
        let newId = null;
        if (result && Array.isArray(result[0]) && result[0].length > 0) {
            newId = result[0][0].newInsertId || null;
        }
        
        return newId;
    },

    setArchived: async (enrollmentId, isArchived) => {
        const query = `CALL SetEnrollmentArchived(?, ?)`;
        const [result] = await mysqlPool.execute(query, [enrollmentId, isArchived ? 1 : 0]);
        return result;
    }
};

module.exports = EnrollmentModel;