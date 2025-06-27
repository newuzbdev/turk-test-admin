// import avatar from '../../assets/avatar.png';
import { Avatar, Layout, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { routerConfig, type RouterConfig } from '../../routes/router-config';
import ThemeSwitcher from '../ui/theme-switcher';

export default function Header() {
    const location = useLocation();
    const [name, setName] = useState('');
    const findTitle = useCallback(
        (list: RouterConfig[], parentPath: string): any => {
            for (let route of list) {
                const currentPath = parentPath + '/' + route.path;
                if (location.pathname === currentPath) {
                    return route.title;
                } else if (route.children) {
                    const childTitle = findTitle(route.children, currentPath);
                    if (childTitle) return childTitle;
                }
            }
            return undefined
        },
        [location.pathname, routerConfig]
    );
    useEffect(() => {
        const title = findTitle(routerConfig, '');
        if (title) {
            setName(title);
        } else {
            setName('');
        }
    }, [location.pathname, findTitle]);
    return (
        <Layout.Header className='flex justify-between items-center'>
            <Typography.Title>{name}</Typography.Title>
            <div className='flex items-center gap-3 justify-center'>
                <ThemeSwitcher />
                {/* <Avatar alt='avatar' shape='circle' size={48} src={avatar} /> */}
            </div>
        </Layout.Header>
    );
}