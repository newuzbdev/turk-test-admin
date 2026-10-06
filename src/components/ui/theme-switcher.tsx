import { useContext } from "react";
import { Sun, Moon } from "lucide-react";
import { ThemeContext } from "../../providers/theme-provider";

export default function ThemeSwitcher() {
  const { theme, toggleMode } = useContext(ThemeContext);

  return (
    <button
      type="button"
      className="admin-icon-button"
      onClick={() => toggleMode()}
      aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      title={theme === "dark" ? "Açık tema" : "Koyu tema"}
    >
      {theme === "dark" ? (
        <Sun size={18} strokeWidth={2.2} />
      ) : (
        <Moon size={18} strokeWidth={2.2} />
      )}
    </button>
  );
}
