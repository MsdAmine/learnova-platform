import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../context/AuthContext';

export default function UnauthorizedPage() {
    const { isAuthenticated } = useAuth();
    const backTo = isAuthenticated ? '/dashboard' : '/';
    const backLabel = isAuthenticated ? 'Back to dashboard' : 'Back to home';

    return (
        <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
            <Card className="max-w-sm w-full">
                <CardHeader>
                    <ShieldOff size={32} className="text-text-muted mb-sm" aria-hidden="true" />
                    <CardTitle>Access denied</CardTitle>
                    <CardDescription>
                        You do not have permission to view this page.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="mt-lg">
                    <Button asChild variant="secondary">
                        <Link to={backTo}>{backLabel}</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
