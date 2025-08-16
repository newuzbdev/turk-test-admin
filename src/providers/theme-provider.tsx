import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";

interface IThemeContext {
  theme: "dark" | "light";
  toggleMode: (mode?: IThemeContext["theme"]) => void;
}

export const ThemeContext = createContext<IThemeContext>({} as IThemeContext);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [theme, setTheme] = useState<IThemeContext["theme"]>(() => {
    const storedTheme = localStorage.getItem("theme") as
      | IThemeContext["theme"]
      | null;
    if (storedTheme) return storedTheme;

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark ? "dark" : "light";
  });

  const toggleMode = (mode?: IThemeContext["theme"]): void => {
    setTheme((prev) => {
      const newTheme = mode ? mode : prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
