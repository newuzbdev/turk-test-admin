// src/providers/auth-provider.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

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

  const checkAuthStatus = useCallback((): boolean => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsAuthenticated(false);
      return false;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;

      if (payload.exp < currentTime) {
        // Token is expired, try to refresh it
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          // Attempt to refresh token
          fetch(`${(import.meta.env.VITE_API_URL || "https://api.turkishmock.uz")}/api/auth/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.accessToken) {
                localStorage.setItem("accessToken", data.accessToken);
                if (data.refreshToken) {
                  localStorage.setItem("refreshToken", data.refreshToken);
                }
                setIsAuthenticated(true);
              } else {
                // Refresh failed, clear tokens and redirect
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                setIsAuthenticated(false);
                window.location.href = "/login";
              }
            })
            .catch(() => {
              // Refresh failed, clear tokens and redirect
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              setIsAuthenticated(false);
              window.location.href = "/login";
            });
          return false;
        } else {
          // No refresh token, clear tokens and redirect
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setIsAuthenticated(false);
          window.location.href = "/login";
          return false;
        }
      }

      setIsAuthenticated(true);
      return true;
    } catch (error) {
      // Invalid token
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setIsAuthenticated(false);
      window.location.href = "/login";
      return false;
    }
  }, []);

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
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
