const express = require('express');
const { getEmployeeStats, getManagerStats } = require('../controllers/dashboardController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/employee', authenticateToken, getEmployeeStats);
router.get('/manager', authenticateToken, authorizeRole(['manager']), getManagerStats);

module.exports = router;
