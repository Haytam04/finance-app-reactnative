import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { LightTheme, DarkTheme } from './src/constants/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = React.useState(false);

  const paperTheme = isDarkTheme ? DarkTheme : LightTheme;
  const navTheme = isDarkTheme ? NavDarkTheme : NavDefaultTheme;

  const combinedTheme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: paperTheme.colors.background,
      card: paperTheme.colors.surface,
      text: paperTheme.colors.onSurface,
      border: paperTheme.colors.outline,
      notification: paperTheme.colors.error,
    },
  };

  return (
    <AuthProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer theme={combinedTheme}>
          <AppNavigator />
          <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}
