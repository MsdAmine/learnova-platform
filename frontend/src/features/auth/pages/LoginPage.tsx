import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data } = await api.post('/api/v1/auth/login', { email, password });
            login(data.accessToken, {
                id: data.userId,
                fullName: data.fullName,
                email: data.email,
                roles: data.roles,
                availableProfiles: [],
                instructorApprovalStatus: null,
            });
            navigate('/');
        } catch (err: any) {
            const message = err.response?.data?.message || 'Invalid credentials';
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Learnova</h1>
                <h2 style={styles.subtitle}>Sign in to your account</h2>

                {error && <p style={styles.error}>{error}</p>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <label style={styles.label}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={styles.input}
                        placeholder="you@example.com"
                    />

                    <label style={styles.label}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={styles.input}
                        placeholder="••••••••"
                    />

                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p style={styles.footer}>
                    Don't have an account?{' '}
                    <Link to="/register" style={styles.link}>Register</Link>
                </p>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    card: {
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
    },
    title: { textAlign: 'center', marginBottom: '0.25rem' },
    subtitle: { textAlign: 'center', fontWeight: 400, marginBottom: '1.5rem', color: '#555' },
    error: { color: '#c0392b', backgroundColor: '#fdecea', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' },
    form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    label: { fontWeight: 500, fontSize: '0.9rem' },
    input: { padding: '0.6rem 0.75rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' },
    button: { marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#2c3e50', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' },
    footer: { textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem' },
    link: { color: '#2c3e50', fontWeight: 500 },
};