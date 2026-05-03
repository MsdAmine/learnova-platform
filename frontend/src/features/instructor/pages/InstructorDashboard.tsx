import { useAuth } from '../../../context/AuthContext';

export default function InstructorDashboard() {
    const { user } = useAuth();

    return (
        <div>
            <h2>Welcome, {user?.fullName}</h2>
            <p>You are in <strong>Instructor</strong> mode.</p>
            <p>Course management coming in Phase 3.</p>
        </div>
    );
}