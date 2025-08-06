// src/providers/auth-provider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { useAdminRefresh } from "@/config/queries/login-querys";

const AuthContext = createContext<{
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  checkAuthStatus: () => boolean;
}>({
  isAuthenticated: false,
  setAuthenticated: () => {},
  checkAuthStatus: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const refreshMutation = useAdminRefresh();

  const checkAuthStatus = (): boolean => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsAuthenticated(false);
      return false;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        // Token is expired, try to refresh
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          refreshMutation.mutate(undefined, {
            onSuccess: () => {
              setIsAuthenticated(true);
            },
            onError: () => {
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              setIsAuthenticated(false);
            },
          });
        } else {
          localStorage.removeItem("accessToken");
          setIsAuthenticated(false);
        }
        return false;
      }
      
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      // Invalid token
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setIsAuthenticated(false);
      return false;
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check auth status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated, 
        setAuthenticated: setIsAuthenticated,
        checkAuthStatus 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
