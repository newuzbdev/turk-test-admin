// src/providers/auth-provider.tsx
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<{
    isAuthenticated: boolean;
    setAuthenticated: (auth: boolean) => void;
}>({
    isAuthenticated: false,
    setAuthenticated: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        setIsAuthenticated(!!token);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, setAuthenticated: setIsAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
