import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DashboardPlaceholder() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Welcome, {user?.fullName}</h1>
            <p>Roles: {user?.roles.join(', ')}</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}