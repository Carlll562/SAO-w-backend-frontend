const { mysqlPool } = require('../config/db');

const StudentModel = {
    add: async (data) => {
        // Matches: PROCEDURE AddStudent(ID_Number, lastName, firstName, Section)
        const query = `CALL AddStudent(?, ?, ?, ?)`;
        const values = [data.idNumber, data.lastName, data.firstName, data.section];
        const [result] = await mysqlPool.execute(query, values);
        return result;
    }
};

module.exports = StudentModel;