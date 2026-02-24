const StudentModel = require('../models/studentModel');
const AuditModel = require('../models/auditModel'); 

const addStudent = async (req, res, next) => {
    const studentData = req.body;
    const performer = req.user?.username || 'Unknown User'; 

    try {
        if (!studentData.idNumber || !studentData.lastName || !studentData.firstName || !studentData.section) {
            throw new Error("Validation Failed: Missing student details.");
        }

        await StudentModel.add(studentData);

        await AuditModel.logAction('system', {
            action: 'ADD_STUDENT',
            performer,
            details: studentData,
            status: 'SUCCESS'
        });

        res.status(201).json({
            success: true,
            message: `Student ${studentData.idNumber} added successfully.`
        });

    } catch (err) {
        await AuditModel.logAction('system', {
            action: 'ADD_STUDENT_FAILED',
            performer,
            details: studentData,
            status: 'FAILURE',
            errorMessage: err.message
        });
        next(err); 
    }
};

module.exports = { addStudent };