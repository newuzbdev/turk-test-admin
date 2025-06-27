import { createContext, type PropsWithChildren, useEffect, useState } from 'react';
interface IThemeContext {
    theme: 'dark' | 'light';
    toggleMode: (mode?: IThemeContext['theme']) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<IThemeContext>({} as IThemeContext);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
    const [theme, setTheme] = useState<IThemeContext['theme']>('dark');
    const toggleMode = (mode?: IThemeContext['theme']): void => {
        setTheme(() => {
            if (mode) {
                return mode;
            } else if (theme === 'dark') {
                return 'light';
            } else {
                return 'dark';
            }
        });
    };

    useEffect(() => {
        const mode = window.matchMedia('(prefers-color-scheme: dark)');

        if (mode.matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }, []);

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    return <ThemeContext.Provider value={{ theme, toggleMode }}>{children}</ThemeContext.Provider>;
};
