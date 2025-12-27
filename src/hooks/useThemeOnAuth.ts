import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * Hook that sets dark mode as default when user is authenticated
 * Call this in protected routes/layouts
 */
export function useThemeOnAuth() {
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    // Set dark mode as default for authenticated users if no preference is set
    if (theme === "system" || !theme) {
      setTheme("dark");
    }
  }, []);

  return { setTheme, theme };
}
