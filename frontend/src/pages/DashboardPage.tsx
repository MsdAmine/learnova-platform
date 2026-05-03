import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import LearnerDashboard from '../features/learner/pages/LearnerDashboard';
import InstructorDashboard from '../features/instructor/pages/InstructorDashboard';
import {useCurrentUser} from "../hooks/useCurrentUser.ts";


export default function DashboardPage() {
    useCurrentUser();
    const { activeProfile } = useAuth();

    return (
        <MainLayout>
            {activeProfile === 'INSTRUCTOR' ? (
                <InstructorDashboard />
            ) : (
                <LearnerDashboard />
            )}
        </MainLayout>
    );
}