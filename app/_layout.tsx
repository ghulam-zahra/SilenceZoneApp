import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerBackgroundTask } from '../utils/backgroundTask';
import { ThemeProvider } from '../utils/ThemeContext';

export default function RootLayout() {
  useEffect(() => {
    registerBackgroundTask();
  }, []);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}