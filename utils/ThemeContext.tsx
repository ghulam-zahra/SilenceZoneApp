import React, { createContext, useContext, useState } from 'react';
import { darkTheme, lightTheme } from './theme';

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: any) {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}