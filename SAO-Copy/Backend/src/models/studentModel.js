const { mysqlPool } = require('../config/db');

const StudentModel = {
    add: async (data) => {
        // Matches: PROCEDURE AddStudent(ID_Number, lastName, firstName, Section)
        const query = `CALL AddStudent(?, ?, ?, ?)`;
        const values = [data.idNumber, data.lastName, data.firstName, data.section];
        const [result] = await mysqlPool.execute(query, values);
        return result;
    },

    setArchived: async (idNumber, archived) => {
        // Matches: PROCEDURE SetStudentArchived(p_ID_Number, p_Archived)
        const query = `CALL SetStudentArchived(?, ?)`;
        const values = [idNumber, archived ? 1 : 0];
        const [result] = await mysqlPool.execute(query, values);
        return result;
    },

    update: async (idNumber, data) => {
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
        return result;
    },
};

module.exports = StudentModel;