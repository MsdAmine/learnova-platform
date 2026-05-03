import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type {ProfileType} from '../../types/profile';
import api from '../../api/axios';

export default function Navbar() {
    const { user, activeProfile, setActiveProfile, logout } = useAuth();
    const navigate = useNavigate();

    const availableProfiles: ProfileType[] = user?.availableProfiles ?? [];

    async function handleSwitch(profile: ProfileType) {
        if (profile === activeProfile) return;

        try {
            await api.post('/api/v1/profile/switch', { profileType: profile });
            setActiveProfile(profile);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Could not switch profile');
        }
    }

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <nav style={styles.nav}>
            <span style={styles.brand}>Learnova</span>

            <div style={styles.right}>
                {availableProfiles.length > 1 && (
                    <div style={styles.switcher}>
                        {availableProfiles.map((profile) => (
                            <button
                                key={profile}
                                onClick={() => handleSwitch(profile)}
                                style={{
                                    ...styles.profileBtn,
                                    ...(activeProfile === profile ? styles.profileBtnActive : {}),
                                }}
                            >
                                {profile.charAt(0) + profile.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                )}

                {availableProfiles.length === 1 && (
                    <span style={styles.profileLabel}>
            {activeProfile?.charAt(0) + activeProfile!.slice(1).toLowerCase()}
          </span>
                )}

                <span style={styles.userName}>{user?.fullName}</span>

                <button onClick={handleLogout} style={styles.logoutBtn}>
                    Logout
                </button>
            </div>
        </nav>
    );
}

const styles: Record<string, React.CSSProperties> = {
    nav: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 2rem',
        backgroundColor: '#2c3e50',
        color: '#fff',
    },
    brand: { fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.5px' },
    right: { display: 'flex', alignItems: 'center', gap: '1rem' },
    switcher: { display: 'flex', gap: '0.5rem' },
    profileBtn: {
        padding: '0.35rem 0.85rem',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.4)',
        backgroundColor: 'transparent',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '0.85rem',
    },
    profileBtnActive: {
        backgroundColor: '#fff',
        color: '#2c3e50',
        fontWeight: 600,
        border: '1px solid #fff',
    },
    profileLabel: {
        fontSize: '0.85rem',
        backgroundColor: '#fff',
        color: '#2c3e50',
        padding: '0.35rem 0.85rem',
        borderRadius: '20px',
        fontWeight: 600,
    },
    userName: { fontSize: '0.9rem', opacity: 0.85 },
    logoutBtn: {
        padding: '0.35rem 0.85rem',
        borderRadius: '4px',
        border: '1px solid rgba(255,255,255,0.4)',
        backgroundColor: 'transparent',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '0.85rem',
    },
};