import { RouterProvider } from 'react-router';
import { router } from '../routes/route';

export function RouterProviders() {
    return <RouterProvider router={router} />
}