const { mysqlPool } = require('../config/db');

const EnrollmentModel = {
    enroll: async (data, performer) => {
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

        // Ensure Created_By / Updated_By reflect the real performer
        if (performer && newId != null) {
            await mysqlPool.execute(
                `UPDATE enrollment SET Created_By = ?, Updated_By = ? WHERE ID = ?`,
                [performer, performer, newId]
            );
        }

        return newId;
    },

    setArchived: async (enrollmentId, isArchived, performer) => {
        const query = `CALL SetEnrollmentArchived(?, ?)`;
        const [result] = await mysqlPool.execute(query, [enrollmentId, isArchived ? 1 : 0]);

        if (performer) {
            await mysqlPool.execute(
                `UPDATE enrollment SET Updated_By = ? WHERE ID = ?`,
                [performer, enrollmentId]
            );
        }

        return result;
    }
};

module.exports = EnrollmentModel;