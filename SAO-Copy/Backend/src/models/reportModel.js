const { mysqlPool } = require('../config/db');

const ReportModel = {
    /**
     * Fetches the student transcript from the VIEW studenttranscripts.
     * Uses backticks for column names with spaces from the SQL script.
     */
    getTranscript: async (idNumber) => {
        const query = 'SELECT * FROM studenttranscripts WHERE `ID Number` = ?';
        const [rows] = await mysqlPool.execute(query, [idNumber]);
        return rows;
    },

    /**
     * Fetches the Dean's List from the VIEW deanslist.
     * Logic: GWA >= 3.50 and Total_Units >= 15.
     */
    getDeansList: async () => {
        const query = 'SELECT * FROM deanslist';
        const [rows] = await mysqlPool.execute(query);
        return rows;
    },

    /**
     * Moved from GradeModel: Fetches specific GWA using the calcGWA function.
     */
    getStudentGWA: async (idNumber) => {
        const query = 'SELECT calcGWA(?) AS gwa';
        const [rows] = await mysqlPool.execute(query, [idNumber]);
        return rows[0].gwa;
    }
};

module.exports = ReportModel;