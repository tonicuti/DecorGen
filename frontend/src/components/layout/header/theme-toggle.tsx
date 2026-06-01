import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme-provider";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-8 w-8 rounded-full text-zinc-600 transition-all duration-300 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      title={isDark ? "Light Mode" : "Dark Mode"}
    >
      <div
        className={`flex items-center justify-center transition-transform duration-500 ${
          isDark ? "rotate-180" : "rotate-0"
        }`}
      >
        {isDark ? (
          <Sun className="h-4 w-4 rotate-0 text-yellow-500 transition-all hover:scale-110" />
        ) : (
          <Moon className="h-4 w-4 rotate-0 text-blue-500 transition-all hover:scale-110" />
        )}
      </div>
      <span className="sr-only">Toggle Theme</span>
    </Button>
  );
}

export { ThemeToggle };
