import { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const { user } = useAuthStore();
    const [attendance, setAttendance] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', employeeId: '', status: '' });
    const [employeeSummary, setEmployeeSummary] = useState(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            if (user?.role === 'employee') {
                const statsRes = await api.get('/attendance/stats');
                setStats(statsRes.data);
                setAttendance(statsRes.data.recentAttendance);
            } else if (user?.role === 'manager') {
                const statsRes = await api.get('/attendance/manager-stats');
                setStats(statsRes.data);

                const params = {};
                if (filters.startDate) params.startDate = filters.startDate;
                if (filters.endDate) params.endDate = filters.endDate;
                if (filters.employeeId) params.employeeId = filters.employeeId;
                if (filters.status) params.status = filters.status;

                const allRes = await api.get('/attendance/all', { params });
                setAttendance(allRes.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [user, filters]);

    useEffect(() => {
        if (user?.role === 'manager' && filters.employeeId && attendance.length > 0) {
            let present = 0;
            let absent = 0;
            let late = 0;
            let totalMs = 0;

            attendance.forEach(record => {
                if (record.status === 'present') present++;
                if (record.status === 'absent') absent++;
                if (record.status === 'late') late++;

                if (record.checkInTime && record.checkOutTime) {
                    const inTime = new Date(record.checkInTime);
                    const outTime = new Date(record.checkOutTime);
                    totalMs += (outTime - inTime);
                }
            });

            const totalHours = (totalMs / (1000 * 60 * 60)).toFixed(2);
            setEmployeeSummary({ present, absent, late, totalHours });
        } else {
            setEmployeeSummary(null);
        }
    }, [attendance, filters.employeeId, user]);

    const handleCheckIn = async () => {
        try {
            await api.post('/attendance/checkin');
            fetchDashboardData();
        } catch (error) {
            alert(error.response?.data?.message || 'Check-in failed');
        }
    };

    const handleCheckOut = async () => {
        try {
            await api.post('/attendance/checkout');
            fetchDashboardData();
        } catch (error) {
            alert(error.response?.data?.message || 'Check-out failed');
        }
    };

    const handleExport = async () => {
        try {
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.employeeId) params.employeeId = filters.employeeId;
            if (filters.status) params.status = filters.status;

            const response = await api.get('/attendance/export', { params, responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'attendance_report.csv');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    return (
        <div className="dashboard container">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                {user?.role === 'employee' && (
                    <div className="actions">
                        <button onClick={handleCheckIn} className="btn btn-success" disabled={stats?.todayStatus !== 'Not Checked In'}>
                            Quick Check In
                        </button>
                        <button onClick={handleCheckOut} className="btn btn-danger" disabled={stats?.todayStatus !== 'Checked In'}>
                            Quick Check Out
                        </button>
                    </div>
                )}
                {user?.role === 'manager' && (
                    <div className="actions">
                        <button onClick={handleExport} className="btn btn-primary">Export CSV</button>
                    </div>
                )}
            </div>

            {/* Stats Section */}
            {stats && (
                <div className="stats-grid">
                    {user?.role === 'employee' ? (
                        <>
                            <div className="stat-card">
                                <h3>Today's Status</h3>
                                <p className={`status status-${stats.todayStatus.toLowerCase().replace(/ /g, '-')}`}>{stats.todayStatus}</p>
                            </div>
                            <div className="stat-card">
                                <h3>This Month</h3>
                                <div className="month-stats">
                                    <p>Present: {stats.monthStats.present}</p>
                                    <p>Absent: {stats.monthStats.absent}</p>
                                    <p>Late: {stats.monthStats.late}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <h3>Total Hours</h3>
                                <p>{stats.monthStats.totalHours} hrs</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="stat-card">
                                <h3>Total Employees</h3>
                                <p>{stats.overview.totalEmployees}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Present Today</h3>
                                <p>{stats.overview.present}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Absent Today</h3>
                                <p>{stats.overview.absent}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Late Today</h3>
                                <p>{stats.overview.late}</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Manager Charts Section */}
            {user?.role === 'manager' && stats && (
                <div className="charts-section">
                    <div className="chart-container">
                        <h3>Weekly Attendance Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.weeklyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="present" fill="#82ca9d" name="Present" />
                                <Bar dataKey="late" fill="#ffc658" name="Late" />
                                <Bar dataKey="absent" fill="#ff8042" name="Absent" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-container">
                        <h3>Department-wise Attendance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.departmentStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="present" fill="#8884d8" name="Present" />
                                <Bar dataKey="absent" fill="#82ca9d" name="Absent" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Absent Employees List (Manager Only) */}
            {user?.role === 'manager' && stats?.absentEmployees?.length > 0 && (
                <div className="absent-list-section">
                    <h3>Absent Employees Today</h3>
                    <ul className="absent-list">
                        {stats.absentEmployees.map(emp => (
                            <li key={emp._id}>{emp.name} ({emp.department})</li>
                        ))}
                    </ul>
                </div>
            )}

            {user?.role === 'manager' && (
                <div className="filters-section">
                    <h3>Filters</h3>
                    <div className="filters">
                        <input
                            type="text"
                            placeholder="Employee ID"
                            value={filters.employeeId}
                            onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                        />
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                        </select>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                        <button onClick={fetchDashboardData} className="btn btn-secondary">Apply</button>
                        <button onClick={() => setFilters({ startDate: '', endDate: '', employeeId: '', status: '' })} className="btn btn-danger" style={{ marginLeft: '10px' }}>Reset</button>
                    </div>
                </div>
            )}

            {/* Employee Summary Section */}
            {user?.role === 'manager' && employeeSummary && filters.employeeId && (
                <div className="stats-grid" style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <div className="stat-card">
                        <h3>Summary for {filters.employeeId}</h3>
                        <div className="month-stats">
                            <p>Present: {employeeSummary.present}</p>
                            <p>Absent: {employeeSummary.absent}</p>
                            <p>Late: {employeeSummary.late}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <h3>Total Hours</h3>
                        <p>{employeeSummary.totalHours} hrs</p>
                    </div>
                </div>
            )}

            <div className="attendance-list">
                <h3>Attendance History</h3>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                {user?.role === 'manager' && <th>Employee</th>}
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map((record) => (
                                <tr key={record._id}>
                                    <td>{new Date(record.date).toLocaleDateString()}</td>
                                    {user?.role === 'manager' && (
                                        <td>{record.user?.name} ({record.user?.employeeId})</td>
                                    )}
                                    <td>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                                    <td>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                                    <td>
                                        <span className={`status status-${record.status}`}>{record.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
