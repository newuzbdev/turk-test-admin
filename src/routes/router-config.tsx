import { Outlet } from 'react-router';
import { Listening, Reading } from './lazy-pages';
import { Book, Headphones } from 'lucide-react';


export interface RouterConfig {
    title: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    page: React.ReactNode;
    children?: RouterConfig[];
    inMenu: boolean;
    isChild?: boolean;
}

export const routerConfig: RouterConfig[] = [
    {
        title: 'Reading',
        label: 'Reading',
        icon: <Book />,
        path: 'reading',
        page: <Reading />,
        inMenu: true,
    },
    {
        title: 'Listening',
        label: 'Listening',
        icon: <Headphones />,
        path: 'listening',
        page: <Listening />,
        inMenu: true,
    },
    // {
    //     title: 'Manage Ads',
    //     label: 'Manage Ads',
    //     icon: <Plus />,
    //     path: 'manage-ads',
    //     page: <Outlet />,
    //     inMenu: true,
    //     children: [
    //         {
    //             title: 'Ads',
    //             label: 'Ads',
    //             icon: undefined,
    //             path: 'ads',
    //             page: <Ads />,
    //             inMenu: true,
    //         },
    //         {
    //             title: 'Targets',
    //             label: 'Targets',
    //             icon: undefined,
    //             path: 'targets',
    //             page: <Targets />,
    //             inMenu: true,
    //         },
    //     ],
    // },
]