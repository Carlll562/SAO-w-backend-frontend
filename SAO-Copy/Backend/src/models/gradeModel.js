const { mysqlPool } = require('../config/db');

const GradeModel = {
    /**
     * Updates a student's grade using the stored procedure.
     * SQL Reference: CALL GradeUpdate(p_Student_Fullname, p_Course_Code, p_RawGrade)
     */
    updateGrade: async (data, performer) => {
        const query = `CALL GradeUpdate(?, ?, ?)`;
        const values = [data.fullname, data.courseCode, data.rawGrade];
        const [result] = await mysqlPool.execute(query, values);

        // Ensure Updated_By on the enrollment row matches the performer
        if (performer) {
            await mysqlPool.execute(
                `
                UPDATE enrollment e
                JOIN student s ON e.STUDENT_ID = s.ID_Number
                JOIN curriculum cu ON e.CURRICULUM_ID = cu.ID
                JOIN course c ON cu.COURSE_ID = c.ID
                SET e.Updated_By = ?
                WHERE s.fullName = ? AND c.Code = ?
                `,
                [performer, data.fullname, data.courseCode]
            );
        }

        return result;
    }
};

module.exports = GradeModel;