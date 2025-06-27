import { Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { getAllRoutesForRouter } from './get-all-routes';
import { routerConfig } from './router-config';
import RootLayout from '../components/layout/layout';

export const router = createBrowserRouter([
    {
        path: '',
        element: (
            <Suspense>
                <RootLayout />
            </Suspense>
        ),
        children: [...getAllRoutesForRouter(routerConfig)],
    },
]);