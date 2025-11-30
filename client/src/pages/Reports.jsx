import { useState, useEffect } from 'react';
import api from '../api/axios';

const Reports = () => {
    const [attendance, setAttendance] = useState([]);
    const [filteredAttendance, setFilteredAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [departmentStats, setDepartmentStats] = useState({});

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        fetchData();
        fetchEmployees();
    }, []);

    useEffect(() => {
        filterData();
    }, [attendance, startDate, endDate, selectedEmployee]);

    const fetchEmployees = async () => {
        try {
            // Assuming we can get a list of employees from the attendance data or a separate endpoint
            // For now, extracting unique employees from attendance data after fetch
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/attendance/all');
            setAttendance(res.data);
            setFilteredAttendance(res.data);
            calculateStats(res.data);

            // Extract unique employees for filter
            const uniqueEmployees = Array.from(new Set(res.data.map(a => JSON.stringify({ id: a.user?._id, name: a.user?.name, empId: a.user?.employeeId }))))
                .map(e => JSON.parse(e))
                .filter(e => e.id);
            setEmployees(uniqueEmployees);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let data = [...attendance];

        if (startDate) {
            data = data.filter(record => new Date(record.date) >= new Date(startDate));
        }

        if (endDate) {
            data = data.filter(record => new Date(record.date) <= new Date(endDate));
        }

        if (selectedEmployee) {
            data = data.filter(record => record.user?._id === selectedEmployee);
        }

        setFilteredAttendance(data);
        calculateStats(data);
    };

    const calculateStats = (data) => {
        const stats = {};
        data.forEach(record => {
            const dept = record.user?.department || 'Unknown';
            if (!stats[dept]) {
                stats[dept] = { present: 0, absent: 0, late: 0, total: 0 };
            }
            stats[dept].total++;
            if (record.status === 'present') stats[dept].present++;
            if (record.status === 'absent') stats[dept].absent++;
            if (record.status === 'late') stats[dept].late++;
        });
        setDepartmentStats(stats);
    };

    const downloadCSV = () => {
        if (filteredAttendance.length === 0) return;

        const headers = ['Date', 'Employee ID', 'Name', 'Department', 'Status', 'Check In', 'Check Out'];
        const rows = filteredAttendance.map(record => [
            new Date(record.date).toLocaleDateString(),
            record.user?.employeeId || 'N/A',
            record.user?.name || 'N/A',
            record.user?.department || 'N/A',
            record.status,
            record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-',
            record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="container dashboard">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Attendance Reports</h2>
            </div>

            {/* Filters */}
            <div className="filters-container" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label>Start Date</label>
                    <input
                        type="date"
                        className="form-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label>End Date</label>
                    <input
                        type="date"
                        className="form-control"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label>Employee</label>
                    <select
                        className="form-control"
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                        <option value="">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.empId})</option>
                        ))}
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={downloadCSV} className="btn btn-primary" disabled={loading || filteredAttendance.length === 0}>
                        Export Filtered to CSV
                    </button>
                </div>
            </div>

            {loading ? <p>Loading data...</p> : (
                <>
                    {/* Stats Cards */}
                    <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        {Object.entries(departmentStats).map(([dept, stat]) => (
                            <div key={dept} className="stat-card">
                                <h3>{dept} Department</h3>
                                <div className="month-stats">
                                    <p>Total Records: {stat.total}</p>
                                    <p style={{ color: '#28a745' }}>Present: {stat.present} ({((stat.present / stat.total) * 100).toFixed(1)}%)</p>
                                    <p style={{ color: '#ffc107' }}>Late: {stat.late} ({((stat.late / stat.total) * 100).toFixed(1)}%)</p>
                                    <p style={{ color: '#dc3545' }}>Absent: {stat.absent} ({((stat.absent / stat.total) * 100).toFixed(1)}%)</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Data Table */}
                    <div className="table-container" style={{ overflowX: 'auto' }}>
                        <h3>Detailed Attendance Data ({filteredAttendance.length} records)</h3>
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f1f1', textAlign: 'left' }}>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Date</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Employee</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Department</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Status</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Check In</th>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Check Out</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAttendance.slice(0, 50).map((record) => (
                                    <tr key={record._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>{new Date(record.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '10px' }}>{record.user?.name} ({record.user?.employeeId})</td>
                                        <td style={{ padding: '10px' }}>{record.user?.department}</td>
                                        <td style={{ padding: '10px', textTransform: 'capitalize', color: record.status === 'present' ? '#28a745' : record.status === 'absent' ? '#dc3545' : record.status === 'late' ? '#ffc107' : '#fd7e14' }}>
                                            {record.status}
                                        </td>
                                        <td style={{ padding: '10px' }}>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                                        <td style={{ padding: '10px' }}>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredAttendance.length > 50 && <p style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>Showing first 50 records. Export to CSV to see all.</p>}
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
