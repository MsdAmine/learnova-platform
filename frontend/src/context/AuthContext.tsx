import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import type { ProfileType } from '../types/profile';

interface User {
    id: number;
    fullName: string;
    email: string;
    roles: string[];
    availableProfiles: ProfileType[];
    instructorApprovalStatus: string | null;
    learnerOnboardingCompleted: boolean | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    activeProfile: ProfileType | null;
    login: (token: string, user: User) => void;
    refreshUser: (user: User) => void;
    logout: () => void;
    setActiveProfile: (profile: ProfileType) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem('token')
    );
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('user:v1');
        return stored ? JSON.parse(stored) : null;
    });
    const [activeProfile, setActiveProfileState] = useState<ProfileType | null>(
        () => (localStorage.getItem('activeProfile') as ProfileType) || null
    );

    const login = useCallback((token: string, user: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user:v1', JSON.stringify(user));
        setToken(token);
        setUser(user);
        setActiveProfileState('LEARNER');
        localStorage.setItem('activeProfile', 'LEARNER');
    }, []);

    const refreshUser = useCallback((freshUser: User) => {
        localStorage.setItem('user:v1', JSON.stringify(freshUser));
        setUser(freshUser);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user:v1');
        localStorage.removeItem('activeProfile');
        setToken(null);
        setUser(null);
        setActiveProfileState(null);
    }, []);

    const setActiveProfile = useCallback((profile: ProfileType) => {
        setActiveProfileState(profile);
        localStorage.setItem('activeProfile', profile);
    }, []);

    const contextValue = useMemo(() => ({
        user,
        token,
        activeProfile,
        login,
        refreshUser,
        logout,
        setActiveProfile,
        isAuthenticated: !!token,
    }), [user, token, activeProfile, login, refreshUser, logout, setActiveProfile]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = use(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
