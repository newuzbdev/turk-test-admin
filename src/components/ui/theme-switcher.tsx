import { useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from 'antd';
import { ThemeContext } from '../../providers/theme-provider';

export default function ThemeSwitcher() {
    const { theme, toggleMode } = useContext(ThemeContext);
    return <Button style={{ outline: 'none', paddingTop: 4 }} icon={theme == 'dark' ? <Sun /> : <Moon />} onClick={() => toggleMode()}></Button>;
}