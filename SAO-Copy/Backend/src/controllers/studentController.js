const StudentModel = require('../models/studentModel');
const AuditModel = require('../models/auditModel'); 

const validateStudentId = (id) => {
    const trimmed = String(id).trim();
    if (trimmed.length !== 8) {
        const err = new Error("ID Number must be exactly 8 characters long (to match VARCHAR(8)).");
        err.statusCode = 400;
        throw err;
    }
    return trimmed;
};

const addStudent = async (req, res, next) => {
    const studentData = req.body;
    const performer = req.user?.email || req.user?.username || req.user?.name || 'Unknown User'; 

    try {
        const { idNumber, lastName, firstName, section } = studentData;

        // Basic presence checks
        if (!idNumber || !lastName || !firstName || !section) {
            const err = new Error("Validation Failed: ID Number, First Name, Last Name, and Section are required.");
            err.statusCode = 400;
            throw err;
        }

        const trimmedId = validateStudentId(idNumber);

        // Enforce name and section length limits from schema
        if (String(firstName).length > 30 || String(lastName).length > 30) {
            const err = new Error("First Name and Last Name cannot exceed 30 characters.");
            err.statusCode = 400;
            throw err;
        }

        if (String(section).length > 45) {
            const err = new Error("Section cannot exceed 45 characters.");
            err.statusCode = 400;
            throw err;
        }

        await StudentModel.add(
            {
                idNumber: trimmedId,
                lastName: String(lastName).trim(),
                firstName: String(firstName).trim(),
                section: String(section).trim(),
            },
            performer
        );

        await AuditModel.logAction('system', {
            action: 'ADD_STUDENT',
            performer,
            details: studentData,
            status: 'SUCCESS'
        });

        res.status(201).json({
            success: true,
            message: `Student ${trimmedId} added successfully.`
        });

    } catch (err) {
        if (err.sqlState === '45000' && !err.statusCode) {
            err.statusCode = 400;
        }

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

const updateStudent = async (req, res, next) => {
    const performer = req.user?.email || req.user?.username || req.user?.name || 'Unknown User';
    const { id } = req.params;
    const { firstName, lastName, section, currentYear, currentSemester } = req.body;

    try {
        const trimmedId = validateStudentId(id);

        if (!firstName || !lastName || !section) {
            const err = new Error("Validation Failed: First Name, Last Name, and Section are required.");
            err.statusCode = 400;
            throw err;
        }

        if (String(firstName).length > 30 || String(lastName).length > 30) {
            const err = new Error("First Name and Last Name cannot exceed 30 characters.");
            err.statusCode = 400;
            throw err;
        }

        if (String(section).length > 45) {
            const err = new Error("Section cannot exceed 45 characters.");
            err.statusCode = 400;
            throw err;
        }

        const yearInt = Number(currentYear);
        const semInt = Number(currentSemester);

        if (!Number.isInteger(yearInt) || yearInt < 1 || yearInt > 4) {
            const err = new Error("Current Year must be an integer between 1 and 4.");
            err.statusCode = 400;
            throw err;
        }

        if (!Number.isInteger(semInt) || semInt < 1 || semInt > 3) {
            const err = new Error("Current Semester must be an integer between 1 and 3.");
            err.statusCode = 400;
            throw err;
        }

        await StudentModel.update(
            trimmedId,
            {
                firstName: String(firstName).trim(),
                lastName: String(lastName).trim(),
                section: String(section).trim(),
                currentYear: yearInt,
                currentSemester: semInt,
            },
            performer
        );

        await AuditModel.logAction('system', {
            action: 'UPDATE_STUDENT',
            performer,
            details: { idNumber: trimmedId, firstName, lastName, section, currentYear: yearInt, currentSemester: semInt },
            status: 'SUCCESS'
        });

        res.status(200).json({
            success: true,
            message: `Student ${trimmedId} updated successfully.`
        });
    } catch (err) {
        if (err.sqlState === '45000' && !err.statusCode) {
            err.statusCode = 400;
        }

        await AuditModel.logAction('system', {
            action: 'UPDATE_STUDENT_FAILED',
            performer,
            details: { idNumber: id, firstName, lastName, section, currentYear, currentSemester },
            status: 'FAILURE',
            errorMessage: err.message
        });

        next(err);
    }
};

const setArchivedStatus = async (req, res, next) => {
    const performer = req.user?.email || req.user?.username || req.user?.name || 'Unknown User';
    const { id } = req.params;
    const { archived } = req.body;

    try {
        const trimmedId = validateStudentId(id);

        if (archived === undefined) {
            const err = new Error("Request must include 'archived' boolean.");
            err.statusCode = 400;
            throw err;
        }

        await StudentModel.setArchived(trimmedId, !!archived, performer);

        await AuditModel.logAction('system', {
            action: archived ? 'ARCHIVE_STUDENT' : 'RESTORE_STUDENT',
            performer,
            details: { idNumber: trimmedId, archived: !!archived },
            status: 'SUCCESS'
        });

        res.status(200).json({
            success: true,
            message: archived 
                ? `Student ${trimmedId} archived successfully.`
                : `Student ${trimmedId} restored successfully.`
        });
    } catch (err) {
        if (err.sqlState === '45000' && !err.statusCode) {
            err.statusCode = 400;
        }

        await AuditModel.logAction('system', {
            action: 'SET_STUDENT_ARCHIVE_FAILED',
            performer,
            details: { idNumber: id, archived },
            status: 'FAILURE',
            errorMessage: err.message
        });

        next(err);
    }
};

module.exports = { addStudent, updateStudent, setArchivedStatus };