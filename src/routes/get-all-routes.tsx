import { Suspense } from 'react';
import type { RouterConfig } from './router-config';

interface RoutesForRouter {
    path: string;
    element: React.ReactNode;
    children?: RoutesForRouter[];
}

export const getAllRoutesForRouter = (list: RouterConfig[]): RoutesForRouter[] => {
    return list.map(route => {
        return {
            path: route.path,
            element: <Suspense>{route.page}</Suspense>,
            children: route.children ? getAllRoutesForRouter(route.children) : undefined,
        };
    });
};

export const getAllRoutesForMenu = (
    list: RouterConfig[],
    pathFromParent?: string
): { key: string; icon: React.ReactNode; label: string; }[] => {
    return list
        .filter(route => route.inMenu)
        .map(route => ({
            key: pathFromParent ? pathFromParent + '/' + route.path : '/' + route.path,
            icon: route.icon,
            label: route.label,
            children: route.children
                ? getAllRoutesForMenu(route.children, pathFromParent ? pathFromParent + '/' + route.path : '/' + route.path)
                : undefined,
        }));
};