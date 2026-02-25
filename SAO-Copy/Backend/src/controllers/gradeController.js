const GradeModel = require('../models/gradeModel');
const AuditModel = require('../models/auditModel');

const updateStudentGrade = async (req, res, next) => {
    const { fullname, courseCode, rawGrade } = req.body;
    const performer = req.user?.username || req.user?.name || req.user?.email || 'Unknown Performer';

    try {
        await GradeModel.updateGrade({ fullname, courseCode, rawGrade });

        await AuditModel.logAction('grade', {
            performer,
            action: 'UPDATE_GRADE',
            status: 'SUCCESS',
            student: fullname,
            course: courseCode,
            grade: rawGrade
        });

        res.status(200).json({ success: true, message: `Grade updated for ${fullname}` });
    } catch (err) {
        await AuditModel.logAction('grade', {
            performer,
            action: 'GRADE_UPDATE_FAILED',
            status: 'FAILURE',
            errorMessage: err.message,
            details: { fullname, courseCode, rawGrade }
        });
        next(err);
    }
};

module.exports = { updateStudentGrade };