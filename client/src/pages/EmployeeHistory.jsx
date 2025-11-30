import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';

const EmployeeHistory = () => {
    const [date, setDate] = useState(new Date());
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/attendance/my-history');
            setAttendanceHistory(res.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    useEffect(() => {
        updateSelectedRecord(date);
    }, [date, attendanceHistory]);

    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const updateSelectedRecord = (selectedDate) => {
        const dateStr = formatDate(selectedDate);
        const record = attendanceHistory.find(r =>
            r.date.startsWith(dateStr) || new Date(r.date).toISOString().split('T')[0] === dateStr
        );
        setSelectedRecord(record || null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return '#28a745'; // Green
            case 'absent': return '#dc3545'; // Red
            case 'late': return '#ffc107'; // Yellow
            case 'half-day': return '#fd7e14'; // Orange
            default: return null;
        }
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = formatDate(date);
            const record = attendanceHistory.find(r =>
                r.date.startsWith(dateStr) || new Date(r.date).toISOString().split('T')[0] === dateStr
            );

            if (record) {
                return (
                    <div style={{
                        height: '8px',
                        width: '8px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(record.status),
                        margin: '2px auto'
                    }}></div>
                );
            }
        }
    };

    return (
        <div className="container dashboard">
            <h2>My Attendance History</h2>
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
                    <div className="stat-card">
                        <h3>{date.toDateString()}</h3>
                        {selectedRecord ? (
                            <div className="record-details">
                                <p><strong>Status:</strong> <span style={{ color: getStatusColor(selectedRecord.status), textTransform: 'capitalize' }}>{selectedRecord.status}</span></p>
                                <p><strong>Check In:</strong> {selectedRecord.checkInTime ? new Date(selectedRecord.checkInTime).toLocaleTimeString() : '-'}</p>
                                <p><strong>Check Out:</strong> {selectedRecord.checkOutTime ? new Date(selectedRecord.checkOutTime).toLocaleTimeString() : '-'}</p>
                                {selectedRecord.checkInTime && selectedRecord.checkOutTime && (
                                    <p><strong>Total Hours:</strong> {((new Date(selectedRecord.checkOutTime) - new Date(selectedRecord.checkInTime)) / (1000 * 60 * 60)).toFixed(2)} hrs</p>
                                )}
                            </div>
                        ) : (
                            <p>No attendance record for this date.</p>
                        )}

                        <div style={{ marginTop: '20px' }}>
                            <h4>Legend</h4>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#28a745' }}></div> Present</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#dc3545' }}></div> Absent</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffc107' }}></div> Late</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fd7e14' }}></div> Half Day</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeHistory;
