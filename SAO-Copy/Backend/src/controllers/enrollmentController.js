const EnrollmentModel = require('../models/enrollmentModel');
const AuditModel = require('../models/auditModel');

const enrollStudent = async (req, res, next) => {
    const enrollData = req.body;
    const performer = req.user?.username || 'Unknown User';

    try {
        if (!enrollData.fullName || !enrollData.courseCode || !enrollData.programName || !enrollData.yearId || !enrollData.semesterId) {
            const error = new Error("Missing enrollment details");
            error.statusCode = 400;
            throw error;
        }

        await EnrollmentModel.enroll(enrollData);

        await AuditModel.logAction('enrollment', {
            performer,
            action: 'ENROLL_STUDENT',
            status: 'SUCCESS',
            student: enrollData.fullName,
            course: enrollData.courseCode,
            details: enrollData
        });

        res.status(200).json({ success: true, message: "Enrollment successful." });

    } catch (err) {
        await AuditModel.logAction('enrollment', {
            performer,
            action: 'ENROLL_FAILED',
            status: 'FAILURE',
            errorMessage: err.message,
            details: enrollData
        });
        next(err);
    }
};

module.exports = { enrollStudent };