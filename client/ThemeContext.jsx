import { createContext, useContext, useState } from "react";
import { COLORS, COLORS_DARK } from "./constants";

const ThemeContext = createContext(null);

export function ThemeProvider(props) {
  const [darkMode, setDarkMode] = useState(false);

  function toggleDarkMode() {
    setDarkMode(!darkMode);
  }

  let colors = COLORS;
  if (darkMode) {
    colors = COLORS_DARK;
  }

  const value = { darkMode: darkMode, colors: colors, toggleDarkMode: toggleDarkMode };

  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
