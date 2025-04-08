import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
    let token: string |null =null;
        if (Platform.OS === 'web') {
          token = await AsyncStorage.getItem('userToken');
        }
        else{
          token = await SecureStore.getItemAsync('userToken');
        }
        setIsAuthenticated(!!token);

      SplashScreen.hideAsync();
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace('/login'); // 🚀 Redirect to login if not authenticated
    } else if (isAuthenticated === true) {
      router.replace('/'); // 🚀 Redirect to main `(tabs)` instead of `/home`
    }
  }, [isAuthenticated]);

  if (!loaded || isAuthenticated === null) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
