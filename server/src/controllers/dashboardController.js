const User = require('../models/User');
const Attendance = require('../models/Attendance');

const getEmployeeStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.find({ user: userId });

        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'half-day').length;
        const lateDays = attendance.filter(a => a.status === 'late').length;
        const absentDays = attendance.filter(a => a.status === 'absent').length;

        const todayRecord = attendance.find(a => {
            const d = new Date(a.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
        });

        res.json({
            totalDays,
            presentDays,
            lateDays,
            absentDays,
            todayStatus: todayRecord ? todayRecord.status : 'Not Marked',
            checkInTime: todayRecord?.checkInTime || null,
            checkOutTime: todayRecord?.checkOutTime || null,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getManagerStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalEmployees = await User.countDocuments({ role: 'employee' });

        const todayAttendance = await Attendance.find({
            date: {
                $gte: today,
                $lte: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        const presentCount = todayAttendance.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'half-day').length;
        const absentCount = totalEmployees - presentCount; // Simplified logic

        res.json({
            totalEmployees,
            presentCount,
            absentCount,
            attendanceRate: totalEmployees > 0 ? (presentCount / totalEmployees) * 100 : 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getEmployeeStats, getManagerStats };
