import { Layout } from 'antd';
import { Outlet } from 'react-router';
import Header from './header';
import Sidebar from './sidebar';

export default function RootLayout() {
    return (
        <Layout className='overflow-hidden h-screen'>
            <Sidebar />
            <Layout>
                <Header />
                <Layout.Content className='overflow-auto py-3 px-8'>
                    <Outlet />
                </Layout.Content>
            </Layout>
        </Layout>
    );
}