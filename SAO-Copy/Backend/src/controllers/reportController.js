const ReportModel = require('../models/reportModel');
const AuditModel = require('../models/auditModel');

const getTranscript = async (req, res, next) => {
    const { id } = req.params;
    const performer = req.user?.username || req.user?.name || req.user?.email || 'Unknown User';

    try {
        const data = await ReportModel.getTranscript(id);
        await AuditModel.logAction('system', {
            action: 'VIEW_TRANSCRIPT',
            performer,
            details: { studentId: id },
            status: 'SUCCESS'
        });

        res.status(200).json({ success: true, studentId: id, data });
    } catch (err) {
        next(err);
    }
};

const getDeansList = async (req, res, next) => {
    const performer = req.user?.username || req.user?.name || req.user?.email || 'Unknown User';
    try {
        const data = await ReportModel.getDeansList();
        await AuditModel.logAction('system', {
            action: 'VIEW_DEANS_LIST',
            performer,
            status: 'SUCCESS'
        });
        res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
        next(err);
    }
};

const getStudentGWA = async (req, res, next) => {
    const { id } = req.params;
    const performer = req.user?.username || req.user?.name || req.user?.email || 'Unknown User';
    try {
        const gwa = await ReportModel.getStudentGWA(id);
        await AuditModel.logAction('system', {
            action: 'CHECK_GWA',
            performer,
            details: { studentId: id },
            status: 'SUCCESS'
        });
        res.status(200).json({ success: true, studentId: id, gwa: gwa || "0.00" });
    } catch (err) {
        next(err);
    }
};

module.exports = { getTranscript, getDeansList, getStudentGWA };