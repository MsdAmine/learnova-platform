import { useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export function useCurrentUser() {
    const { token, user, refreshUser } = useAuth();

    useEffect(() => {
        if (!token || !user) return;

        api.get('/api/v1/auth/me').then(({ data }) => {
            refreshUser({
                id: data.id,
                fullName: data.fullName,
                email: data.email,
                roles: data.roles,
                availableProfiles: data.availableProfiles,
                instructorApprovalStatus: data.instructorApprovalStatus,
            });
        });
    }, [token]);
}
