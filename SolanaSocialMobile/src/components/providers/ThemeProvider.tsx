import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({children}: ThemeProviderProps) {
  const {theme, colors} = useThemeStore();

  useEffect(() => {
    // Update status bar style based on theme
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && colors.background.includes('4.9%'));
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
  }, [theme, colors]);

  return <>{children}</>;
}
