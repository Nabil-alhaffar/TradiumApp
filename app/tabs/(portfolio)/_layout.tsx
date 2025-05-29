
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { Slot } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

const { Navigator } = createMaterialTopTabNavigator();

const TopTabs = withLayoutContext(Navigator);

export default function PortfolioTopTabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>

    <TopTabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarIndicatorStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].tint,
        },
      }}
    >
      <TopTabs.Screen name="orders" options={{ title: 'Orders' }} />
      <TopTabs.Screen name="summary" options={{ title: 'Overview' }} />
      <TopTabs.Screen name="transfers" options={{ title: 'Transfers' }} />
      <Slot />
    </TopTabs>
    </ThemeProvider>

  );
}
