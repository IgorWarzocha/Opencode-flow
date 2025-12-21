import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-md transition-colors flex justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
      title={`Current theme: ${theme}. Click to cycle.`}
    >
      <Icon className="w-5 h-5" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
