const { mysqlPool } = require('../config/db');

const StudentModel = {
    add: async (data, performer) => {
        // Matches: PROCEDURE AddStudent(ID_Number, lastName, firstName, Section)
        const query = `CALL AddStudent(?, ?, ?, ?)`;
        const values = [data.idNumber, data.lastName, data.firstName, data.section];
        const [result] = await mysqlPool.execute(query, values);

        // Ensure Created_By / Updated_By reflect the actual user performing the action
        if (performer) {
            await mysqlPool.execute(
                `UPDATE student SET Created_By = ?, Updated_By = ? WHERE ID_Number = ?`,
                [performer, performer, data.idNumber]
            );
        }

        return result;
    },

    setArchived: async (idNumber, archived, performer) => {
        // Matches: PROCEDURE SetStudentArchived(p_ID_Number, p_Archived)
        const query = `CALL SetStudentArchived(?, ?)`;
        const values = [idNumber, archived ? 1 : 0];
        const [result] = await mysqlPool.execute(query, values);

        // Override Updated_By on the student and their enrollments with the real performer
        if (performer) {
            await mysqlPool.execute(
                `UPDATE student SET Updated_By = ? WHERE ID_Number = ?`,
                [performer, idNumber]
            );

            await mysqlPool.execute(
                `UPDATE enrollment SET Updated_By = ? WHERE STUDENT_ID = ?`,
                [performer, idNumber]
            );
        }

        return result;
    },

    update: async (idNumber, data, performer) => {
        // Matches: PROCEDURE UpdateStudent(p_ID_Number, p_lastName, p_firstName, p_Section, p_currentYear, p_currentSemester)
        const query = `CALL UpdateStudent(?, ?, ?, ?, ?, ?)`;
        const values = [
            idNumber,
            data.lastName,
            data.firstName,
            data.section,
            data.currentYear,
            data.currentSemester,
        ];
        const [result] = await mysqlPool.execute(query, values);

        if (performer) {
            await mysqlPool.execute(
                `UPDATE student SET Updated_By = ? WHERE ID_Number = ?`,
                [performer, idNumber]
            );
        }

        return result;
    },
};

module.exports = StudentModel;