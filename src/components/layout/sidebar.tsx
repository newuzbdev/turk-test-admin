import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router';
// import Logo from '../../assets/Logo.svg';
import { useCallback } from 'react';
import { getAllRoutesForMenu } from '../../routes/get-all-routes';
import { routerConfig } from '../../routes/router-config';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const items = getAllRoutesForMenu(routerConfig);
    const handleClick = useCallback(
        (item: { key: string }) => {
            navigate(item.key)
        },
        [items, navigate]
    );

    return (
        <Layout.Sider
            breakpoint='lg'
            collapsedWidth={60}
            width={280}
            className='h-screen flex flex-col'>
            {/* <img
                loading='lazy'
                src={Logo}
                alt='Logo'
                className='h-16 lg:h-22 p-3 lg:-ml-6 my-2 w-full'
            /> */}

            <Menu
                style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                }}
                theme='dark'
                mode='inline'
                selectedKeys={[location.pathname]}

                items={items}
                onClick={handleClick}
            />
        </Layout.Sider>
    );
}