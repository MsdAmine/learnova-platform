import { createContext, useContext, useState, type ReactNode } from 'react';
import type {ProfileType} from '../types/profile';

interface User {
    id: number;
    fullName: string;
    email: string;
    roles: string[];
    availableProfiles: ProfileType[];
    instructorApprovalStatus: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    activeProfile: ProfileType | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    setActiveProfile: (profile: ProfileType) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(
        localStorage.getItem('token')
    );
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [activeProfile, setActiveProfileState] = useState<ProfileType | null>(
        () => (localStorage.getItem('activeProfile') as ProfileType) || null
    );

    function login(token: string, user: User) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        // default to LEARNER on login
        setActiveProfileState('LEARNER');
        localStorage.setItem('activeProfile', 'LEARNER');
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('activeProfile');
        setToken(null);
        setUser(null);
        setActiveProfileState(null);
    }

    function setActiveProfile(profile: ProfileType) {
        setActiveProfileState(profile);
        localStorage.setItem('activeProfile', profile);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                activeProfile,
                login,
                logout,
                setActiveProfile,
                isAuthenticated: !!token,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}