import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './tokens';

export const useThemeColors = () => (useColorScheme() === 'dark' ? darkTheme : lightTheme);
