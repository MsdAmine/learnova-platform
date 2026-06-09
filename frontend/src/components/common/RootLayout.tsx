import { Outlet } from 'react-router-dom';
import { ApiInterceptorSetup } from './ApiInterceptorSetup';

export default function RootLayout() {
    return (
        <>
            <ApiInterceptorSetup />
            <Outlet />
        </>
    );
}
