import { IELTS, Listening, Login, Reading, Test } from './lazy-pages';
import { Book, BookAudioIcon, Headphones, LogIn, TestTubeIcon } from 'lucide-react';


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
        title: 'Listening',
        label: 'Listening',
        icon: <Headphones />,
        path: 'listening',
        page: <Listening />,
        inMenu: true,
    },
    {
        title: 'Reading',
        label: 'Reading',
        icon: <Book />,
        path: 'reading',
        page: <Reading />,
        inMenu: true,
    },
    {
        title: 'IELTS',
        label: 'IELTS',
        icon: <BookAudioIcon />,
        path: 'ielts',
        page: <IELTS />,
        inMenu: true,
    },
    {
        title: 'Test',
        label: 'Test',
        icon: <TestTubeIcon />,
        path: 'test',
        page: <Test />,
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