import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';

const CalendarView = () => {
    const [date, setDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState([]);
    const [selectedDateStats, setSelectedDateStats] = useState(null);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const res = await api.get('/attendance/all');
            setAttendanceData(res.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    useEffect(() => {
        updateSelectedDateStats(date);
    }, [date, attendanceData]);

    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const updateSelectedDateStats = (selectedDate) => {
        const dateStr = formatDate(selectedDate);
        const dayRecords = attendanceData.filter(record =>
            record.date.startsWith(dateStr) || new Date(record.date).toISOString().split('T')[0] === dateStr
        );

        const present = dayRecords.filter(r => r.status === 'present').length;
        const absent = dayRecords.filter(r => r.status === 'absent').length;
        const late = dayRecords.filter(r => r.status === 'late').length;
        const total = dayRecords.length;

        setSelectedDateStats({ present, absent, late, total, records: dayRecords });
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = formatDate(date);
            const dayRecords = attendanceData.filter(record =>
                record.date.startsWith(dateStr) || new Date(record.date).toISOString().split('T')[0] === dateStr
            );

            if (dayRecords.length === 0) return null;

            const presentCount = dayRecords.filter(r => r.status === 'present').length;
            const totalCount = dayRecords.length;
            const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

            let color = '#ff8042'; // Red (Low attendance)
            if (percentage >= 80) color = '#82ca9d'; // Green (Good)
            else if (percentage >= 50) color = '#ffc658'; // Yellow (Average)

            return (
                <div style={{
                    height: '8px',
                    width: '8px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    margin: '2px auto'
                }}></div>
            );
        }
    };

    return (
        <div className="container dashboard">
            <h2>Team Attendance Calendar</h2>
            <div className="calendar-container" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <Calendar
                        onChange={setDate}
                        value={date}
                        tileContent={tileContent}
                        className="react-calendar-custom"
                    />
                </div>

                <div style={{ flex: '1', minWidth: '300px' }}>
                    {selectedDateStats && (
                        <div className="stat-card">
                            <h3>{date.toDateString()}</h3>
                            <div className="month-stats">
                                <p>Total Records: {selectedDateStats.total}</p>
                                <p style={{ color: '#28a745' }}>Present: {selectedDateStats.present}</p>
                                <p style={{ color: '#ffc107' }}>Late: {selectedDateStats.late}</p>
                                <p style={{ color: '#dc3545' }}>Absent: {selectedDateStats.absent}</p>
                            </div>

                            {selectedDateStats.total > 0 && (
                                <div style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                                    <h4>Absent / Late Employees</h4>
                                    <ul className="absent-list">
                                        {selectedDateStats.records
                                            .filter(r => r.status !== 'present')
                                            .map(r => (
                                                <li key={r._id}>
                                                    {r.user?.name} ({r.user?.department}) - {r.status}
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
