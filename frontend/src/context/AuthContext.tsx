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
        
        // Default to LEARNER if they have it, otherwise check roles
        let defaultProfile: string = 'LEARNER';
        if (user.availableProfiles && user.availableProfiles.length > 0) {
            defaultProfile = user.availableProfiles.includes('LEARNER') ? 'LEARNER' : user.availableProfiles[0];
        } else if (user.roles && user.roles.includes('ROLE_INSTRUCTOR') && !user.roles.includes('ROLE_LEARNER')) {
            defaultProfile = 'INSTRUCTOR';
        }
            
        setActiveProfileState(defaultProfile as ProfileType);
        localStorage.setItem('activeProfile', defaultProfile);
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