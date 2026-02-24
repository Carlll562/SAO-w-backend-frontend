const { mysqlPool } = require('../config/db');

const AdminModel = {
    addProgram: async (name) => {
        await mysqlPool.execute('CALL AddProgram(?)', [name]);
    },
    addCourse: async (name, code, units) => {
        await mysqlPool.execute('CALL AddCourse(?, ?, ?)', [name, code, units]);
    },
    addCurriculum: async (program, year, semester, courseCode) => {
        await mysqlPool.execute('CALL AddCurriculum(?, ?, ?, ?)', [program, year, semester, courseCode]);
    }
};

module.exports = AdminModel;