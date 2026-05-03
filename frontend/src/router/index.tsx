import { createBrowserRouter } from 'react-router-dom';
import NotFoundPage from '../pages/NotFoundPage';

const router = createBrowserRouter([
    {
        path: '/',
        element: <div>Learnova</div>,
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);

export default router;