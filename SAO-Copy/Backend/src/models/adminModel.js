const { mysqlPool } = require('../config/db');

const AdminModel = {
    addProgram: async (name, performer) => {
        await mysqlPool.execute('CALL AddProgram(?)', [name]);

        if (performer) {
            await mysqlPool.execute(
                `UPDATE program SET Created_By = ?, Updated_By = ? WHERE programName = ?`,
                [performer, performer, name]
            );
        }
    },

    addCourse: async (name, code, units, performer) => {
        await mysqlPool.execute('CALL AddCourse(?, ?, ?)', [name, code, units]);

        if (performer) {
            await mysqlPool.execute(
                `UPDATE course SET Created_By = ?, Updated_By = ? WHERE Code = ?`,
                [performer, performer, code]
            );
        }
    },

    addCurriculum: async (program, year, semester, courseCode, performer) => {
        await mysqlPool.execute('CALL AddCurriculum(?, ?, ?, ?)', [program, year, semester, courseCode]);

        if (performer) {
            await mysqlPool.execute(
                `
                UPDATE curriculum cu
                JOIN program p ON cu.PROGRAM_ID = p.ID
                JOIN course c ON cu.COURSE_ID = c.ID
                SET cu.Created_By = ?, cu.Updated_By = ?
                WHERE p.programName = ? 
                  AND cu.YEAR_ID = ?
                  AND cu.SEMESTER_ID = ?
                  AND c.Code = ?
                `,
                [performer, performer, program, year, semester, courseCode]
            );
        }
    }
};

module.exports = AdminModel;