const { mysqlPool } = require('../config/db');

const GradeModel = {
    /**
     * Updates a student's grade using the stored procedure.
     * SQL Reference: CALL GradeUpdate(p_Student_Fullname, p_Course_Code, p_RawGrade)
     */
    updateGrade: async (data) => {
        const query = `CALL GradeUpdate(?, ?, ?)`;
        const values = [data.fullname, data.courseCode, data.rawGrade];
        const [result] = await mysqlPool.execute(query, values);
        return result;
    }
};

module.exports = GradeModel;