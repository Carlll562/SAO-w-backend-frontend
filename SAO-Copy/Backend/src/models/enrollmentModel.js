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
        return result;
    }
};

module.exports = EnrollmentModel;