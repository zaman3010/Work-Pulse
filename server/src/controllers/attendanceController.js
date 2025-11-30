const Attendance = require('../models/Attendance');
const User = require('../models/User');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

// Employee: Check In
const checkIn = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAttendance = await Attendance.findOne({ user: userId, date: today });
        if (existingAttendance) {
            return res.status(400).json({ message: 'Already checked in today' });
        }

        const attendance = await Attendance.create({
            user: userId,
            date: today,
            checkInTime: new Date(),
            status: 'present',
        });

        res.json({ message: 'Checked in successfully', attendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Employee: Check Out
const checkOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({ user: userId, date: today });
        if (!attendance) {
            return res.status(400).json({ message: 'Must check in first' });
        }
        if (attendance.checkOutTime) {
            return res.status(400).json({ message: 'Already checked out' });
        }

        attendance.checkOutTime = new Date();
        await attendance.save();

        res.json({ message: 'Checked out successfully', attendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Employee: My History
const getMyHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const attendance = await Attendance.find({ user: userId }).sort({ date: -1 });
        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Employee: My Summary (Monthly)
const getMySummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const attendance = await Attendance.find({
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const summary = {
            totalDays: attendance.length,
            present: attendance.filter(a => a.status === 'present').length,
            late: attendance.filter(a => a.status === 'late').length,
            absent: attendance.filter(a => a.status === 'absent').length,
            halfDay: attendance.filter(a => a.status === 'half-day').length,
        };

        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Employee: Today's Status
const getTodayStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({ user: userId, date: today });
        res.json(attendance || { status: 'Not Marked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Manager: All Employees
const getAllAttendance = async (req, res) => {
    try {
        const { startDate, endDate, employeeId, status } = req.query;
        const where = {};

        // Date Filter
        if (startDate && endDate) {
            where.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // Status Filter
        if (status) {
            where.status = status;
        }

        // Employee Filter (requires finding user first)
        if (employeeId) {
            const user = await User.findOne({ employeeId });
            if (user) {
                where.user = user._id;
            } else {
                // If user not found with that ID, return empty
                return res.json([]);
            }
        }

        const attendance = await Attendance.find(where)
            .populate('user', 'name email employeeId department')
            .sort({ date: -1 });

        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Manager: Specific Employee
const getEmployeeAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await Attendance.find({ user: id }).sort({ date: -1 });
        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Manager: Team Summary (Today)
const getTeamSummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalEmployees = await User.countDocuments({ role: 'employee' });
        const attendance = await Attendance.find({ date: today });

        const summary = {
            totalEmployees,
            present: attendance.filter(a => a.status === 'present').length,
            late: attendance.filter(a => a.status === 'late').length,
            absent: totalEmployees - attendance.length, // Rough estimate
            onLeave: 0 // Placeholder
        };

        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Manager: Who's Present Today
const getWhoIsPresent = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.find({
            date: today,
            status: { $in: ['present', 'late', 'half-day'] }
        }).populate('user', 'name employeeId department');

        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Manager: Export
const exportAttendance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};

        if (startDate && endDate) {
            where.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const attendance = await Attendance.find(where)
            .populate('user', 'name employeeId department')
            .sort({ date: -1 });

        const csvPath = path.join(__dirname, '../../reports.csv');
        const csvWriter = createCsvWriter({
            path: csvPath,
            header: [
                { id: 'name', title: 'Name' },
                { id: 'employeeId', title: 'Employee ID' },
                { id: 'department', title: 'Department' },
                { id: 'date', title: 'Date' },
                { id: 'checkIn', title: 'Check In' },
                { id: 'checkOut', title: 'Check Out' },
                { id: 'status', title: 'Status' },
            ],
        });

        const records = attendance.map((a) => ({
            name: a.user.name,
            employeeId: a.user.employeeId,
            department: a.user.department,
            date: a.date.toISOString().split('T')[0],
            checkIn: a.checkInTime ? a.checkInTime.toLocaleTimeString() : '-',
            checkOut: a.checkOutTime ? a.checkOutTime.toLocaleTimeString() : '-',
            status: a.status,
        }));

        await csvWriter.writeRecords(records);

        res.download(csvPath, 'attendance_report.csv', (err) => {
            if (err) console.error(err);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



// Employee: Dashboard Stats
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // 1. Today's Status
        const todayAttendance = await Attendance.findOne({ user: userId, date: today });
        let todayStatus = 'Not Checked In';
        if (todayAttendance) {
            todayStatus = todayAttendance.checkOutTime ? 'Checked Out' : 'Checked In';
        }

        // 2. Month Stats
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthAttendance = await Attendance.find({
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const monthStats = {
            present: monthAttendance.filter(a => a.status === 'present').length,
            absent: monthAttendance.filter(a => a.status === 'absent').length,
            late: monthAttendance.filter(a => a.status === 'late').length,
            totalHours: 0
        };

        monthAttendance.forEach(a => {
            if (a.checkInTime && a.checkOutTime) {
                const diff = a.checkOutTime - a.checkInTime;
                monthStats.totalHours += diff / (1000 * 60 * 60); // Convert ms to hours
            }
        });
        monthStats.totalHours = parseFloat(monthStats.totalHours.toFixed(1));

        // 3. Recent Attendance (Last 7 Days)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const recentAttendance = await Attendance.find({
            user: userId,
            date: { $gte: sevenDaysAgo, $lte: today }
        }).sort({ date: -1 });

        res.json({
            todayStatus,
            monthStats,
            recentAttendance
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Manager: Dashboard Stats
const getManagerDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Overview Stats
        const totalEmployees = await User.countDocuments({ role: 'employee' });
        const todayAttendance = await Attendance.find({ date: today });

        const presentCount = todayAttendance.filter(a => a.status === 'present').length;
        const lateCount = todayAttendance.filter(a => a.status === 'late').length;
        const absentCount = totalEmployees - todayAttendance.length; // Approximate

        // 2. Weekly Attendance Trend
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);

        const weeklyAttendance = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: sevenDaysAgo, $lte: today }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Department-wise Attendance (Today)
        // First get all users with their departments
        const allEmployees = await User.find({ role: 'employee' }, 'department');
        const departmentStats = {};

        // Initialize departments
        allEmployees.forEach(emp => {
            if (!departmentStats[emp.department]) {
                departmentStats[emp.department] = { present: 0, absent: 0, total: 0 };
            }
            departmentStats[emp.department].total++;
            departmentStats[emp.department].absent++; // Default to absent
        });

        // Update with today's attendance
        const todayAttendanceWithUser = await Attendance.find({ date: today }).populate('user', 'department');
        todayAttendanceWithUser.forEach(att => {
            if (att.user && departmentStats[att.user.department]) {
                departmentStats[att.user.department].absent--; // Remove from absent
                departmentStats[att.user.department].present++;
            }
        });

        const departmentChartData = Object.keys(departmentStats).map(dept => ({
            name: dept,
            present: departmentStats[dept].present,
            absent: departmentStats[dept].absent
        }));

        // 4. Absent Employees List
        const presentUserIds = todayAttendance.map(a => a.user.toString());
        const absentEmployees = await User.find({
            role: 'employee',
            _id: { $nin: presentUserIds }
        }, 'name employeeId department');

        res.json({
            overview: {
                totalEmployees,
                present: presentCount,
                late: lateCount,
                absent: absentCount
            },
            weeklyTrend: weeklyAttendance,
            departmentStats: departmentChartData,
            absentEmployees
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
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
};
