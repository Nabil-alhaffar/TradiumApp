import { Slot, withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator ,MaterialTopTabNavigationOptions} from '@react-navigation/material-top-tabs';
import { Stack } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();

const TopTabs = withLayoutContext(Navigator);
// export const MaterialTopTabs = withLayoutContext<
//   MaterialTopTabNavigationOptions,
//   typeof Navigator
// >(Navigator);
export default function PortfolioLayout() {
  return (
    // <Stack>
      
    // <Stack.Screen name="summary" options={{ title: "Summary" }} />
    // <Stack.Screen name="orders" options={{ title: "Orders" }} />
    // <Stack.Screen name="transfers" options={{ title: "Transfers" }} />

    // </Stack>
    <TopTabs
      screenOptions={{
        tabBarLabelStyle: { fontSize: 14 },
        tabBarIndicatorStyle: { backgroundColor: '#00FFAA' },
      }}
    >
      <TopTabs.Screen name="index" options={{ title: 'Summary' }} />
      <TopTabs.Screen name="orders" options={{ title: 'Orders' }} />
      <TopTabs.Screen name="transfers" options={{ title: 'Transfers' }} />
      <Slot/>
    </TopTabs>
  );
}

// import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// import { withLayoutContext } from 'expo-router';
// import type {
//   MaterialTopTabNavigationOptions,
//   MaterialTopTabNavigationEventMap,
// } from '@react-navigation/material-top-tabs';
// import type {ParamListBase, TabNavigationState} from '@react-navigation/native';

// // This gives you a top tab layout compatible with Expo Router
// const { Navigator, Screen } = createMaterialTopTabNavigator();
// // const TopTabs = withLayoutContext(Navigator);
// export const TopTabs = withLayoutContext<
//   MaterialTopTabNavigationOptions,
//   typeof Navigator,
//   TabNavigationState<ParamListBase>,
//   MaterialTopTabNavigationEventMap
// >(Navigator);
// export default function PortfolioLayout() {
//   return (
//     <TopTabs
//       screenOptions={{
//         tabBarLabelStyle: { fontSize: 14 },
//         tabBarIndicatorStyle: { backgroundColor: '#00FFAA' },
//       }}
//     >
//       <TopTabs.Screen
//         name="index"
//         options={{ title: 'Summary' }}
//       />
//       <TopTabs.Screen
//         name="orders"
//         options={{ title: 'Orders' }}
//       />
//       <TopTabs.Screen
//         name="transfers"
//         options={{ title: 'Transfers' }}
//       />
//     </TopTabs>
//   );
// }
// // import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// // import { withLayoutContext } from 'expo-router';
// // import { useColorScheme } from 'react-native'; // <-- use this directly if you're not customizing
// // import { Colors } from '@/constants/Colors';

// // import PortfolioScreen from './index';
// // import OrdersScreen from './orders';
// // import TransfersScreen from './transfers';

// // const { Navigator, Screen } = createMaterialTopTabNavigator();
// // const TopTabs = withLayoutContext(Navigator);

// // export default function PortfolioLayout() {
// //   const colorScheme = useColorScheme() ?? 'light';

// //   return (
// //     <TopTabs
// //       screenOptions={{
// //         tabBarActiveTintColor: Colors[colorScheme].tint,
// //         tabBarIndicatorStyle: {
// //           backgroundColor: Colors[colorScheme].tint,
// //         },
// //       }}
// //     >
// //       <Screen name="portfolio" component={PortfolioScreen} />
// //       <Screen name="orders" component={OrdersScreen} />
// //       <Screen name="transfers" component={TransfersScreen} />
// //     </TopTabs>
// //   );
// // }

// // import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// // import { withLayoutContext } from 'expo-router';
// // import { useColorScheme } from '@/hooks/useColorScheme';
// // import { Colors } from '@/constants/Colors';

// // const { Navigator } = createMaterialTopTabNavigator();
// // export const TopTabs = withLayoutContext(Navigator);

// // export default function PortfolioLayout() {
// //   const colorScheme = useColorScheme();

// //   return (
// //     <TopTabs
// //       screenOptions={{
// //         tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
// //         tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
// //         tabBarIndicatorStyle: {
// //           backgroundColor: Colors[colorScheme ?? 'light'].tint,
// //           height: 3,
// //         },
// //         tabBarLabelStyle: {
// //           fontSize: 14,
// //           fontWeight: 'bold',
// //         },
// //         tabBarStyle: {
// //           backgroundColor: Colors[colorScheme ?? 'light'].background,
// //         },
// //       }}
// //     />
// //   );
// // }
// // import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// // import { withLayoutContext } from 'expo-router';
// // import { useColorScheme } from '@/hooks/useColorScheme';
// // import { Colors } from '@/constants/Colors';

// // const { Navigator } = createMaterialTopTabNavigator();
// // const TopTabs = withLayoutContext(Navigator);

// // export default function PortfolioTopTabsLayout() {
// //   const colorScheme = useColorScheme();

// //   return (
// //     <TopTabs
// //       screenOptions={{
// //         tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
// //         tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
// //         tabBarIndicatorStyle: {
// //           backgroundColor: Colors[colorScheme ?? 'light'].tint,
// //           height: 3,
// //         },
// //         tabBarLabelStyle: {
// //           fontSize: 14,
// //           fontWeight: 'bold',
// //           textTransform: 'capitalize',
// //         },
// //         tabBarStyle: {
// //           backgroundColor: Colors[colorScheme ?? 'light'].background,
// //           elevation: 0,
// //           shadowOpacity: 0,
// //         },
// //         tabBarItemStyle: {
// //           width: 'auto',
// //           paddingHorizontal: 16,
// //         },
// //       }}
// //     >
// //       <TopTabs.Screen 
// //         name="index" 
// //         options={{ title: 'Overview' }} 
// //       />
// //       <TopTabs.Screen 
// //         name="orders" 
// //         options={{ title: 'Orders' }} 
// //       />
// //     </TopTabs>
// //   );
// // }
// // import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// // import { Stack, withLayoutContext } from 'expo-router';
// // import PortfolioScreen from './index'; // Automatically maps to 'portfolio/index.tsx'
// // import OrdersScreen from './orders';   // Automatically maps to 'portfolio/orders.tsx'
// // import TransfersScreen from './transfers'; // Automatically maps to 'portfolio/transfers.tsx'

// // const { Navigator, Screen } = createMaterialTopTabNavigator();

// // const TopTabs = withLayoutContext(Navigator);

// // export default function PortfolioTopTabsLayout() {
// //   return (
// //     // <TopTabs>
// //         <Stack>
// //             {/* <Stack.Screen name="index" options={{ headerShown: false }} /> */}
// //             {/* <Screen name="orders" component={OrdersScreen} />
// //             <Screen name="transfers" component={TransfersScreen} /> */}
// //             </Stack>
// //     // </TopTabs>
// //   );
// // }

// // import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// // import { withLayoutContext } from 'expo-router';
// // import { useColorScheme } from '@/hooks/useColorScheme';
// // import { Colors } from '@/constants/Colors';

// // const { Navigator } = createMaterialTopTabNavigator();
// // const TopTabs = withLayoutContext(Navigator);

// // export default function PortfolioTopTabsLayout() {
// //   const colorScheme = useColorScheme();

// //   return (
// //     <TopTabs
// //       screenOptions={{
// //         tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
// //         tabBarIndicatorStyle: {
// //           backgroundColor: Colors[colorScheme ?? 'light'].tint,
// //         },
// //       }}
// //     />
// //   );
// // }


// // import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// // import { withLayoutContext } from 'expo-router';
// // import TransfersScreen from './transfers'
// // import OrdersScreen  from './orders';
// // import PortfolioScreen from '.';
// // const { Navigator, Screen } = createMaterialTopTabNavigator();
// // const TopTabs = withLayoutContext(Navigator);

// // export default function PortfolioTopTabsLayout() {
// //   return (
// // <TopTabs>
// //     <Screen
// //         name="portfolio"
// //         options={{ title: 'Portfolio' }}
// //         >
// //         {() => <PortfolioScreen />}
// //     </Screen> 
// //     <Screen
// //     name="orders"
// //     options={{ title: 'Orders' }}
// //     >
// //     {() => <OrdersScreen />}
// //     </Screen>   
// //    <Screen
// //     name="transfers"
// //     options={{ title: 'Transfers' }}
// //     >
// //     {() => <TransfersScreen />}
// //     </Screen>
// //     </TopTabs>
// //   );
// // }



// // import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// // import { withLayoutContext } from 'expo-router';
// // import { Slot } from 'expo-router';
// // import { useColorScheme } from '@/hooks/useColorScheme';
// // import { Colors } from '@/constants/Colors';
// // import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

// // const { Navigator } = createMaterialTopTabNavigator();

// // const TopTabs = withLayoutContext(Navigator);

// // export default function PortfolioTopTabsLayout() {
// //   const colorScheme = useColorScheme();

// //   return (
// //     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>

// //     <TopTabs
// //       screenOptions={{
// //         tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
// //         tabBarIndicatorStyle: {
// //           backgroundColor: Colors[colorScheme ?? 'light'].tint,
// //         },
// //       }}
// //     >
// //       <Slot />
// //     </TopTabs>
// //     </ThemeProvider>

// //   );
// // }
