import type {ReactNode} from 'react';
import Navbar from '../components/common/Navbar';

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div>
            <Navbar />
            <main style={{ padding: '2rem' }}>{children}</main>
        </div>
    );
}