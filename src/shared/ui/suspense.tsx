import { Suspense as ReactSuspense } from 'react';
import { Spin } from 'antd';

export const LoadingScreen = () => {
    return (
        <div className='fixed inset-0 grid items-center w-full h-full justify-items-center'>
            <Spin size='large' />
        </div>
    );
};

export const Suspense = ({ children }: { children: React.ReactNode }) => {
    return <ReactSuspense fallback={<LoadingScreen />}>{children}</ReactSuspense>;
};