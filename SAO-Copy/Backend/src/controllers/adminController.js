const AdminModel = require('../models/adminModel');
const AuditModel = require('../models/auditModel');

// --- ADD COURSE ---
const createCourse = async (req, res, next) => {
    const { name, code, units } = req.body;
    const performer = req.user?.email || req.user?.username || req.user?.name || 'Unknown Admin';

    try {
        if (!name || !code || !units) throw new Error("Missing Course Name, Code, or Units.");
        
        await AdminModel.addCourse(name, code, units, performer);
        await AuditModel.logAction('system', {
            performer,
            action: 'ADD_NEW_COURSE',
            status: 'SUCCESS',
            details: { name, code, units }
        });

        res.status(201).json({ success: true, message: `Course ${code} added.` });
    } catch (err) {
        await AuditModel.logAction('system', { 
            performer,
            action: 'ADD_COURSE_FAILED', 
            status: 'FAILURE', 
            errorMessage: err.message,
            details: req.body 
        });
        next(err);
    }
};

// --- ADD PROGRAM ---
const createProgram = async (req, res, next) => {
    const { name } = req.body;
    const performer = req.user?.email || req.user?.username || req.user?.name || 'Unknown Admin';

    try {
        if (!name) throw new Error("Program name is required.");
        
        await AdminModel.addProgram(name, performer);
        await AuditModel.logAction('system', {
            performer,
            action: 'ADD_PROGRAM',
            status: 'SUCCESS',
            details: { name }
        });

        res.status(201).json({ success: true, message: `Program ${name} created.` });
    } catch (err) {
        await AuditModel.logAction('system', { 
            performer,
            action: 'ADD_PROGRAM_FAILED', 
            status: 'FAILURE', 
            errorMessage: err.message,
            details: req.body 
        });
        next(err);
    }
};

// --- ADD CURRICULUM ---
const createCurriculumEntry = async (req, res, next) => {
    const { programName, year, semester, courseCode } = req.body;
    const performer = req.user?.email || req.user?.username || req.user?.name || 'Unknown Admin';

    try {
        if (!programName || !year || !semester || !courseCode) throw new Error("Missing Curriculum parameters.");

        await AdminModel.addCurriculum(programName, year, semester, courseCode, performer);
        await AuditModel.logAction('system', {
            performer,
            action: 'ADD_CURRICULUM',
            status: 'SUCCESS',
            details: { programName, year, semester, courseCode }
        });

        res.status(201).json({ success: true, message: "Curriculum entry linked successfully." });
    } catch (err) {
        await AuditModel.logAction('system', { 
            performer,
            action: 'ADD_CURRICULUM_FAILED', 
            status: 'FAILURE', 
            errorMessage: err.message,
            details: req.body 
        });
        next(err);
    }
};

module.exports = { createCourse, createProgram, createCurriculumEntry };