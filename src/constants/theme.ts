import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const customColors = {
    primary: '#4A90E2',
    secondary: '#50E3C2',
    background: '#F4F7FA',
    surface: '#FFFFFF',
    error: '#B00020',
};

export const LightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: customColors.primary,
        secondary: customColors.secondary,
        background: customColors.background,
        surface: customColors.surface,
        elevation: {
            ...MD3LightTheme.colors.elevation,
            level1: '#ffffff',
        }
    },
};

export const DarkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: customColors.primary,
        secondary: customColors.secondary,
        // Add specific dark mode overrides here
    },
};
