import { useAuth } from '../../../context/AuthContext';

export default function LearnerDashboard() {
    const { user } = useAuth();

    return (
        <div>
            <h2>Welcome back, {user?.fullName}</h2>
            <p>You are in <strong>Learner</strong> mode.</p>
            <p>Course browsing and enrollment coming in Phase 3.</p>
        </div>
    );
}