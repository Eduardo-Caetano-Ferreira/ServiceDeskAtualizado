import { createContext, useContext } from 'react';

export const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
  setDarkMode: () => {}
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um ThemeProvider');
  }
  return context;
}
