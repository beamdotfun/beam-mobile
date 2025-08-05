import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Appearance} from 'react-native';
import {Theme, ThemeColors, getThemeColors} from '../styles/theme';

interface ThemeState {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      colors: getThemeColors('system'),
      isDark: Appearance.getColorScheme() === 'dark',

      setTheme: (theme: Theme) => {
        const colors = getThemeColors(theme);
        const isDark =
          theme === 'dark' ||
          (theme === 'system' && Appearance.getColorScheme() === 'dark');
        set({theme, colors, isDark});
      },

      toggleTheme: () => {
        const {theme} = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        const colors = getThemeColors(newTheme);
        const isDark = newTheme === 'dark';
        set({theme: newTheme, colors, isDark});
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Listen to system theme changes
Appearance.addChangeListener(({colorScheme: _colorScheme}) => {
  const {theme, setTheme} = useThemeStore.getState();
  if (theme === 'system') {
    setTheme('system'); // This will trigger a re-evaluation
  }
});
