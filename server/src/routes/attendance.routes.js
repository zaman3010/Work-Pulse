const express = require('express');
const {
    checkIn,
    checkOut,
    getMyHistory,
    getMySummary,
    getTodayStatus,
    getAllAttendance,
    getEmployeeAttendance,
    getTeamSummary,
    getWhoIsPresent,
    exportAttendance,
    getDashboardStats,
    getManagerDashboardStats
} = require('../controllers/attendanceController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Employee Routes
router.post('/checkin', authenticateToken, checkIn);
router.post('/checkout', authenticateToken, checkOut);
router.get('/my-history', authenticateToken, getMyHistory);
router.get('/my-summary', authenticateToken, getMySummary);
router.get('/today', authenticateToken, getTodayStatus);
router.get('/stats', authenticateToken, getDashboardStats);

// Manager Routes
router.get('/all', authenticateToken, authorizeRole(['manager']), getAllAttendance);
router.get('/employee/:id', authenticateToken, authorizeRole(['manager']), getEmployeeAttendance);
router.get('/summary', authenticateToken, authorizeRole(['manager']), getTeamSummary);
router.get('/today-status', authenticateToken, authorizeRole(['manager']), getWhoIsPresent);
router.get('/export', authenticateToken, authorizeRole(['manager']), exportAttendance);
router.get('/manager-stats', authenticateToken, authorizeRole(['manager']), getManagerDashboardStats);

module.exports = router;
