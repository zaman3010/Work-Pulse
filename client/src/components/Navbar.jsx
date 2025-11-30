import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Navbar = () => {
    const { isAuthenticated, logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="logo">Work Pulse</Link>
                <div className="nav-links">
                    {isAuthenticated ? (
                        <>
                            <span className="user-name">Welcome, {user?.name}</span>
                            {user?.role === 'manager' && (
                                <>
                                    <Link to="/calendar" className="btn btn-secondary" style={{ marginRight: '10px' }}>Calendar</Link>
                                    <Link to="/reports" className="btn btn-secondary" style={{ marginRight: '10px' }}>Reports</Link>
                                </>
                            )}
                            <Link to="/profile" className="btn btn-primary" style={{ marginRight: '10px' }}>Profile</Link>
                            {user?.role === 'employee' && (
                                <Link to="/history" className="btn btn-secondary" style={{ marginRight: '10px' }}>History</Link>
                            )}
                            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="nav-link">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
