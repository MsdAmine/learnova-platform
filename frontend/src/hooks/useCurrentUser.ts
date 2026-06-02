import { useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export function useCurrentUser() {
    const { token, refreshUser } = useAuth();

    // refreshUser is not useCallback-wrapped in AuthContext, so a ref keeps
    // the effect stable while always calling the latest version.
    const refreshUserRef = useRef(refreshUser);
    refreshUserRef.current = refreshUser;

    useEffect(() => {
        if (!token) return;

        api.get('/api/v1/auth/me').then(({ data }) => {
            refreshUserRef.current({
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
