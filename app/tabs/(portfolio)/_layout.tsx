
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
// import { Slot, withLayoutContext } from 'expo-router';
// import { createMaterialTopTabNavigator ,MaterialTopTabNavigationOptions} from '@react-navigation/material-top-tabs';
// import { Stack } from "expo-router";

// const { Navigator } = createMaterialTopTabNavigator();

// const TopTabs = withLayoutContext(Navigator);
// // export const MaterialTopTabs = withLayoutContext<
// //   MaterialTopTabNavigationOptions,
// //   typeof Navigator
// // >(Navigator);
// export default function PortfolioLayout() {
//   return (
//     // <Stack>
      
//     // <Stack.Screen name="summary" options={{ title: "Summary" }} />
//     // <Stack.Screen name="orders" options={{ title: "Orders" }} />
//     // <Stack.Screen name="transfers" options={{ title: "Transfers" }} />

//     // </Stack>
//     <TopTabs
//       screenOptions={{
//         tabBarLabelStyle: { fontSize: 14 },
//         tabBarIndicatorStyle: { backgroundColor: '#00FFAA' },
//       }}
//     >
//       <TopTabs.Screen name="index" options={{ title: 'Summary' }} />
//       <TopTabs.Screen name="orders" options={{ title: 'Orders' }} />
//       <TopTabs.Screen name="transfers" options={{ title: 'Transfers' }} />
//       <Slot/>
//     </TopTabs>
//   );
// }






