import { ThemedText } from '@/components/ThemedText';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as SignalRService from '../../app/services/SignalRService';
import { LineChart, LineChartProvider } from 'react-native-wagmi-charts';
import axiosInstance from '../services/AxiosInstance';

interface Watchlist {
  symbols: string[];
  name: string;
}
interface SnapshotResponse {
  snapshots: string; // JSON string that needs parsing
}

interface Snapshot {
  dailyBar?: {
    c: number; // current day's close (or latest daily price)
    t: string; // timestamp
  };
  prevDailyBar?: {
    c: number; // previous close
  };
  latestQuote?: {
    ap: number; // ask price
    bp: number; // bid price
  };
  // ... other fields
}

interface Quote {
  Symbol: string;
  BidPrice: number;
  AskPrice: number;
}

const parseQuote = (raw: any): Quote => ({
  Symbol: raw.s,
  AskPrice: raw.ap,
  BidPrice: raw.bp,
});

interface PrevCloseData {
  [symbol: string]: number;
}
interface ChartData {
  [symbol: string]: { timestamp: number; value: number }[];
}

let token: string | null = null;
let userId: string | null = null;

const WatchlistScreen = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [prevCloses, setPrevCloses] = useState<PrevCloseData>({});
  const [chartData, setChartData] = useState<ChartData>({});

  useEffect(() => {
    const fetchWatchlistsAndSnapshots = async () => {
      try {
        if (Platform.OS === 'web') {
          token = await AsyncStorage.getItem('userToken');
          userId = await AsyncStorage.getItem('userId');
        } else {
          token = await SecureStore.getItemAsync('userToken');
          userId = await SecureStore.getItemAsync('userId');
        }

        const response = await axiosInstance.get(
          `/watchlists/${userId}`
        );
        const fetchedWatchlists: Watchlist[] = response.data;
        setWatchlists(fetchedWatchlists);

        const allSymbols = Array.from(new Set(fetchedWatchlists.flatMap(w => w.symbols)));
        if(allSymbols.length>0){
        const snapshotResponse = await axiosInstance.get<SnapshotResponse>(
          '/alpaca/snapshots',
          {
            params: { symbols: allSymbols },
          
          }
        );
      
        const parsedSnapshots: Record<string, Snapshot> = JSON.parse(snapshotResponse.data.snapshots);

        const closes: PrevCloseData = {};
        const chart: ChartData = {};

        for (const symbol of allSymbols) {
          closes[symbol] = parsedSnapshots[symbol]?.prevDailyBar?.c ?? null;

          // Generate sample chart data from minuteBars if available
          const bars = parsedSnapshots[symbol]?.minuteBars;
          if (bars) {
            chart[symbol] = bars.map(b => ({
              timestamp: new Date(b.t).getTime(),
              value: b.c,
            }));
          }
        }

        setPrevCloses(closes);
        setChartData(chart);

        await SignalRService.connectToMarketData();
        SignalRService.registerQuoteListener((rawQuote: any) => {
          const parsed = parseQuote(rawQuote);
          setQuotes(prev => ({ ...prev, [parsed.Symbol]: parsed }));
        });

        for (const symbol of allSymbols) {
          await SignalRService.joinSymbolGroup(symbol);
        }
      }
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlistsAndSnapshots();

    return () => {
      SignalRService.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00ffcc" />
        <Text style={styles.text}>Loading watchlists...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load watchlists: {error}</Text>
      </View>
    );
  }

  if (!watchlists || watchlists.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No watchlists available</Text>
      </View>
    );
  }

  const currentWatchlist = watchlists[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.navContainer}>
        <TouchableOpacity
          onPress={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
          disabled={currentIndex === 0}
          style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
        >
          <Text style={styles.navText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{currentWatchlist.name}</Text>
        <TouchableOpacity
          onPress={() => setCurrentIndex(prev => Math.min(prev + 1, watchlists.length - 1))}
          disabled={currentIndex === watchlists.length - 1}
          style={[styles.navButton, currentIndex === watchlists.length - 1 && styles.disabledButton]}
        >
          <Text style={styles.navText}>▶</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.symbolList}>
        {currentWatchlist.symbols.map((symbol, index) => {
          const quote = quotes[symbol];
          const prevClose = prevCloses[symbol];
          const realTimePrice = quote ? (quote.AskPrice + quote.BidPrice) / 2 : null;
          const fallbackPrice = prevClose ?? null;
          const price = realTimePrice ?? fallbackPrice;

          let changePercent = null;
          if (price != null && prevClose != null) {
            changePercent = ((price - prevClose) / prevClose) * 100;
          }

          const displayPrice = price?.toFixed(2) ?? '-';
          const displayChange = changePercent != null ? `${changePercent.toFixed(2)}%` : '-';
          const color =
            changePercent == null
              ? '#fff'
              : changePercent > 0
              ? '#00ff00'
              : '#ff4d4d';

          const lineData = chartData[symbol];

          return (
            <View key={index} style={styles.symbolItem}>
              <Text style={styles.symbolText}>{symbol}</Text>
              <Text style={{ color }}>{displayPrice} ({displayChange})</Text>
              {lineData && (
                <LineChartProvider data={{ points: lineData }}>
                  <LineChart height={40} width={200}>
                    <LineChart.Path color="#00ffcc" width={2} />
                    <LineChart.Dot color="#00ffcc" at={2}/>
                  </LineChart>
                </LineChartProvider>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default WatchlistScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#ccc', fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ff4d4d', fontSize: 16 },
  navContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navButton: {
    padding: 10,
    backgroundColor: '#1e90ff',
    borderRadius: 8,
  },
  disabledButton: { backgroundColor: '#555' },
  navText: { fontSize: 20, color: '#fff' },
  symbolList: { marginTop: 10 },
  symbolItem: {
    padding: 12,
    backgroundColor: '#1e1e1e',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  symbolText: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
});


// import { ThemedText } from '@/components/ThemedText';
// import axios from 'axios';
// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as SecureStore from 'expo-secure-store';
// // import {
// //   connectToMarketData,
// //   joinSymbolGroup,
// //   disconnect,
// //   registerQuoteListener,
// // } from '../../app/services/SignalRService';
// import * as SignalRService from '../../app/services/SignalRService';

// interface Watchlist {
//   symbols: string[];
//   name: string;
// }
// interface SnapshotResponse {
//   snapshots: string; // JSON string that needs parsing
// }

// interface Snapshot {
//   prevDailyBar: {
//     c: number; // previous close
//   };
// }

// interface Quote {
//   Symbol: string;
//   BidPrice: number;
//   AskPrice: number;
// }

// const parseQuote = (raw: any): Quote => ({
//   Symbol: raw.s,
//   AskPrice: raw.ap,
//   BidPrice: raw.bp,
// });

// interface PrevCloseData {
//   [symbol: string]: number;
// }

// let token: string | null = null;
// let userId: string | null = null;

// const WatchlistScreen = () => {
//   const [watchlists, setWatchlists] = useState<Watchlist[] | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [quotes, setQuotes] = useState<Record<string, Quote>>({});
//   const [prevCloses, setPrevCloses] = useState<PrevCloseData>({});

//   useEffect(() => {
//     const fetchWatchlistsAndSnapshots = async () => {
//       try {
//         if (Platform.OS === 'web') {
//           token = await AsyncStorage.getItem('userToken');
//           userId = await AsyncStorage.getItem('userId');
//         } else {
//           token = await SecureStore.getItemAsync('userToken');
//           userId = await SecureStore.getItemAsync('userId');
//         }

//         const response = await axios.get(
//           `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/watchlists/${userId}`
//         );
//         const fetchedWatchlists: Watchlist[] = response.data;
//         setWatchlists(fetchedWatchlists);

//         const allSymbols = Array.from(new Set(fetchedWatchlists.flatMap(w => w.symbols)));

//         const snapshotResponse = await axios.get<SnapshotResponse>(
//           'https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/alpaca/snapshots',
//           {
//             params: { symbols: allSymbols },
//             paramsSerializer: (params) => {
//               const query = new URLSearchParams();
//               (params.symbols as string[]).forEach((symbol) =>
//                 query.append('symbols', symbol)
//               );
//               return query.toString();
//             },
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//         const parsedSnapshots: Record<string, Snapshot> = JSON.parse(snapshotResponse.data.snapshots);

//         const closes: PrevCloseData = {};
//         for (const symbol of allSymbols) {
//           closes[symbol] = parsedSnapshots[symbol]?.prevDailyBar?.c ?? null;
//         }

//         setPrevCloses(closes);

//         await SignalRService.connectToMarketData(); // no handlers here

//         // Register real-time quote listener
//         SignalRService.registerQuoteListener((rawQuote: any) => {
//           const parsed = parseQuote(rawQuote);
//           setQuotes(prev => ({ ...prev, [parsed.Symbol]: parsed }));
//         });

//         for (const symbol of allSymbols) {
//           await SignalRService.joinSymbolGroup(symbol);
//         }

//       } catch (error) {
//         console.error('Error loading data:', error);
//         setError(error instanceof Error ? error.message : 'Unknown error');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchWatchlistsAndSnapshots();

//     return () => {
//       SignalRService.disconnect();
//     };
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.loader}>
//         <ActivityIndicator size="large" color="#00ffcc" />
//         <Text style={styles.text}>Loading watchlists...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>Failed to load watchlists: {error}</Text>
//       </View>
//     );
//   }

//   if (!watchlists || watchlists.length === 0) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>No watchlists available</Text>
//       </View>
//     );
//   }

//   const currentWatchlist = watchlists[currentIndex];

//   return (
//     <View style={styles.container}>
//       <View style={styles.navContainer}>
//         <TouchableOpacity
//           onPress={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
//           disabled={currentIndex === 0}
//           style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
//         >
//           <Text style={styles.navText}>◀</Text>
//         </TouchableOpacity>
//         <Text style={styles.title}>{currentWatchlist.name}</Text>
//         <TouchableOpacity
//           onPress={() => setCurrentIndex(prev => Math.min(prev + 1, watchlists.length - 1))}
//           disabled={currentIndex === watchlists.length - 1}
//           style={[styles.navButton, currentIndex === watchlists.length - 1 && styles.disabledButton]}
//         >
//           <Text style={styles.navText}>▶</Text>
//         </TouchableOpacity>
//       </View>

//       <ScrollView style={styles.symbolList}>
//         {currentWatchlist.symbols.map((symbol, index) => {
//           const quote = quotes[symbol];
//           const prevClose = prevCloses[symbol];
//           const price = quote ? (quote.AskPrice + quote.BidPrice) / 2 : null;

//           let changePercent = null;
//           if (price != null && prevClose != null) {
//             changePercent = ((price - prevClose) / prevClose) * 100;
//           }

//           const displayPrice = price?.toFixed(2) ?? '-';
//           const displayChange = changePercent != null ? `${changePercent.toFixed(2)}%` : '-';
//           const color =
//             changePercent == null
//               ? '#fff'
//               : changePercent > 0
//               ? '#00ff00'
//               : '#ff4d4d';

//           return (
//             <View key={index} style={styles.symbolItem}>
//               <Text style={styles.symbolText}>{symbol}</Text>
//               <Text style={{ color }}>{displayPrice} ({displayChange})</Text>
//             </View>
//           );
//         })}
//       </ScrollView>
//     </View>
//   );
// };

// export default WatchlistScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#121212', padding: 16 },
//   title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' },
//   loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   text: { color: '#ccc', fontSize: 16 },
//   errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   errorText: { color: '#ff4d4d', fontSize: 16 },
//   navContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
//   navButton: {
//     padding: 10,
//     backgroundColor: '#1e90ff',
//     borderRadius: 8,
//   },
//   disabledButton: { backgroundColor: '#555' },
//   navText: { fontSize: 20, color: '#fff' },
//   symbolList: { marginTop: 10 },
//   symbolItem: {
//     padding: 12,
//     backgroundColor: '#1e1e1e',
//     marginBottom: 8,
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   symbolText: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
// });


// import { ThemedText } from '@/components/ThemedText';
// import axios from 'axios';
// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as SecureStore from 'expo-secure-store';
// import {
//   connectToMarketData,
//   joinSymbolGroup,
//   disconnect,
// } from '../../app/services/SignalRService';

// interface Watchlist {
//   symbols: string[];
//   name: string;
// }
// interface SnapshotResponse {
//   snapshots: string; // JSON string that needs parsing
// }

// interface Snapshot {
//   prevDailyBar: {
//     c: number; // previous close
//     // other fields (h, l, o, v, etc.) if needed
//   };
// }

// interface Quote {
//   Symbol: string;
//   BidPrice: number;
//   AskPrice: number;
//   // LastPrice: number;
//   // ChangePercent: number;
// }
// const parseQuote = (raw: any): Quote => ({
//   Symbol: raw.S,
//   AskPrice: raw.ap,
//   BidPrice: raw.bp,
// });

// interface PrevCloseData {
//   [symbol: string]: number;
// }

// let token: string | null = null;
// let userId: string | null = null;

// const WatchlistScreen = () => {
//   const [watchlists, setWatchlists] = useState<Watchlist[] | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [quotes, setQuotes] = useState<Record<string, Quote>>({});
//   const [prevCloses, setPrevCloses] = useState<PrevCloseData>({});

//   useEffect(() => {
//     const fetchWatchlistsAndSnapshots = async () => {
//       try {
//         if (Platform.OS === 'web') {
//           token = await AsyncStorage.getItem('userToken');
//           userId = await AsyncStorage.getItem('userId');
//         } else {
//           token = await SecureStore.getItemAsync('userToken');
//           userId = await SecureStore.getItemAsync('userId');
//         }

//         const response = await axios.get(
//           `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/watchlists/${userId}`
//         );
//         const fetchedWatchlists: Watchlist[] = response.data;
//         setWatchlists(fetchedWatchlists);

//         const allSymbols = Array.from(new Set(fetchedWatchlists.flatMap(w => w.symbols)));

//         // Fetch and parse snapshots

//         const snapshotResponse = await axios.get<SnapshotResponse>(
//           'https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/alpaca/snapshots',
//           {
//             params: { symbols: allSymbols },
//             paramsSerializer: (params) => {
//               const query = new URLSearchParams();
//               (params.symbols as string[]).forEach((symbol) =>
//                 query.append('symbols', symbol)
//               );
//               return query.toString();
//             },
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//         const parsedSnapshots: Record<string, Snapshot> = JSON.parse(snapshotResponse.data.snapshots);

//         const closes: PrevCloseData = {};
//         for (const symbol of allSymbols) {
//           closes[symbol] = parsedSnapshots[symbol]?.prevDailyBar?.c ?? null;
//         }

//         setPrevCloses(closes);

//         // Setup SignalR
//         // await connectToMarketData(
//         //   () => {}, // onTrade
//         //   (quote: Quote) => {
//         //     setQuotes(prev => ({ ...prev, [quote.symbol]: quote }));
//         //   },
//         //   () => {} // onBar
//         // );

//         for (const symbol of allSymbols) {
//           await joinSymbolGroup(symbol);
//         }

//       } catch (error) {
//         console.error('Error loading data:', error);
//         setError(error instanceof Error ? error.message : 'Unknown error');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchWatchlistsAndSnapshots();

//     return () => {
//       disconnect();
//     };
//   }, []);


//   if (loading) {
//     return (
//       <View style={styles.loader}>
//         <ActivityIndicator size="large" color="#00ffcc" />
//         <Text style={styles.text}>Loading watchlists...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>Failed to load watchlists: {error}</Text>
//       </View>
//     );
//   }

//   if (!watchlists || watchlists.length === 0) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>No watchlists available</Text>
//       </View>
//     );
//   }

//   const currentWatchlist = watchlists[currentIndex];

//   return (
//     <View style={styles.container}>
//       {/* Navigation */}
//       <View style={styles.navContainer}>
//         <TouchableOpacity
//           onPress={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
//           disabled={currentIndex === 0}
//           style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
//         >
//           <Text style={styles.navText}>◀</Text>
//         </TouchableOpacity>
//         <Text style={styles.title}>{currentWatchlist.name}</Text>
//         <TouchableOpacity
//           onPress={() => setCurrentIndex(prev => Math.min(prev + 1, watchlists.length - 1))}
//           disabled={currentIndex === watchlists.length - 1}
//           style={[styles.navButton, currentIndex === watchlists.length - 1 && styles.disabledButton]}
//         >
//           <Text style={styles.navText}>▶</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Symbols */}
//       <ScrollView style={styles.symbolList}>
//         {currentWatchlist.symbols.map((symbol, index) => {
//           const quote = quotes[symbol];
//           const prevClose = prevCloses[symbol];
//           const price = (quote?.AskPrice+quote?.BidPrice)/2;

//           let changePercent = null;
//           if (price != null && prevClose != null) {
//             changePercent = ((price - prevClose) / prevClose) * 100;
//           }

//           const displayPrice = price?.toFixed(2) ?? '-';
//           const displayChange = changePercent != null ? `${changePercent.toFixed(2)}%` : '-';
//           const color =
//           changePercent == null
//             ? '#fff'
//             : changePercent > 0
//             ? '#00ff00'
//             : changePercent < 0
//             ? '#ff4d4d'
//             : '#fff';
//           return (
//             <View key={index} style={styles.symbolItem}>
//               <Text style={styles.symbolText}>{symbol}</Text>
//               <Text style={{ color }}>{displayPrice} ({displayChange})</Text>
//             </View>
//           );
//         })}
//       </ScrollView>
//     </View>
//   );
// };

// export default WatchlistScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#121212', padding: 16 },
//   title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' },
//   loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   text: { color: '#ccc', fontSize: 16 },
//   errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   errorText: { color: '#ff4d4d', fontSize: 16 },
//   navContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
//   navButton: {
//     padding: 10,
//     backgroundColor: '#1e90ff',
//     borderRadius: 8,
//   },
//   disabledButton: { backgroundColor: '#555' },
//   navText: { fontSize: 20, color: '#fff' },
//   symbolList: { marginTop: 10 },
//   symbolItem: {
//     padding: 12,
//     backgroundColor: '#1e1e1e',
//     marginBottom: 8,
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   symbolText: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
// });


// import { ThemedText } from '@/components/ThemedText';
// import axios from 'axios';
// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as SecureStore from 'expo-secure-store';

// interface Watchlist {
//   symbols: string[];
//   name: string;
// }

// let token: string | null = null;
// let userId: string | null = null;

// const WatchlistScreen = () => {
//   const [watchlists, setWatchlists] = useState<Watchlist[] | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   useEffect(() => {
//     const fetchWatchlists = async () => {
//       try {
//         if (Platform.OS === 'web') {
//           token = await AsyncStorage.getItem('userToken');
//           userId = await AsyncStorage.getItem('userId');
//         } else {
//           token = await SecureStore.getItemAsync('userToken');
//           userId = await SecureStore.getItemAsync('userId');
//         }
        
//         const response = await axios.get(
//           `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/watchlists/${userId}`,
//         );

//         console.log('Fetched watchlists:', response.data);
//         setWatchlists(response.data);
//       } catch (error) {
//         if (axios.isAxiosError(error)) {
//           console.log("Axios error:", error.toJSON());
//         }
//         console.error('Error fetching watchlists', error);
//         setError(error instanceof Error ? error.message : 'Unknown error');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchWatchlists();
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.loader}>
//         <ActivityIndicator size="large" color="#00ffcc" />
//         <Text style={styles.text}>Loading watchlists...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>Failed to load watchlists: {error}</Text>
//       </View>
//     );
//   }

//   if (!watchlists || watchlists.length === 0) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>No watchlists available</Text>
//       </View>
//     );
//   }

//   const currentWatchlist = watchlists[currentIndex];

//   return (
//     <View style={styles.container}>
//       {/* Navigation Buttons */}
//       <View style={styles.navContainer}>
//         <TouchableOpacity
//           onPress={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
//           disabled={currentIndex === 0}
//           style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
//         >
//           <Text style={styles.navText}>◀</Text>
//         </TouchableOpacity>
//         <Text style={styles.title}>{currentWatchlist.name}</Text>
//         <TouchableOpacity
//           onPress={() => setCurrentIndex((prev) => Math.min(prev + 1, watchlists.length - 1))}
//           disabled={currentIndex === watchlists.length - 1}
//           style={[styles.navButton, currentIndex === watchlists.length - 1 && styles.disabledButton]}
//         >
//           <Text style={styles.navText}>▶</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Watchlist Symbols */}
//       <ScrollView style={styles.symbolList}>
//         {currentWatchlist.symbols.map((symbol, index) => (
//           <View key={index} style={styles.symbolItem}>
//             <Text style={styles.symbolText}>{symbol}</Text>
//           </View>
//         ))}
//       </ScrollView>
//     </View>
//   );
// };

// export default WatchlistScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#121212', padding: 16 },
//   title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' },
//   loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   text: { color: '#ccc', fontSize: 16 },
//   errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   errorText: { color: '#ff4d4d', fontSize: 16 },
//   navContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
//   navButton: {
//     padding: 10,
//     backgroundColor: '#1e90ff',
//     borderRadius: 8,
//   },
//   disabledButton: { backgroundColor: '#555' },
//   navText: { fontSize: 20, color: '#fff' },
//   symbolList: { marginTop: 10 },
//   symbolItem: {
//     padding: 12,
//     backgroundColor: '#1e1e1e',
//     marginBottom: 8,
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   symbolText: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
// });

// // import { ThemedText } from '@/components/ThemedText';
// // import axios from 'axios';
// // import React, { useEffect, useState } from 'react';
// // import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
// // import { Platform } from 'react-native';
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// // import * as SecureStore from 'expo-secure-store';

// // interface Watchlist {
// //   symbols: string[];
// //   name: string;
// // }
// // let token: string | null = null;
// // let userId : string| null = null; 

// // const WatchlistScreen = () => {
// //   const [watchlists, setWatchlists] = useState<Watchlist[] | null>(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [currentIndex, setCurrentIndex] = useState(0);

// //   useEffect(() => {
// //     const fetchWatchlists = async () => {
// //       try {

// //         if (Platform.OS === 'web') {
// //           token = await AsyncStorage.getItem('userToken');
// //           userId = await AsyncStorage.getItem('userId');
// //          }
// //       else {
// //           token = await SecureStore.getItemAsync('userToken');
// //           userId = await SecureStore.getItemAsync('userId');
// //          }
// //         const response = await axios.get(
// //           `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/watchlists/${userId}`,
// //           // { headers: { Accept: 'application/json' }, validateStatus: () => true }
// //         );

// //         console.log('Fetched watchlists:', response.data);
// //         setWatchlists(response.data); // Corrected data assignment
// //       } catch (error) {
// //         if (axios.isAxiosError(error)) {
// //           console.log("Axios error:", error.toJSON());  // Shows detailed error info
// //       }         console.error('Error fetching watchlists', error);
// //          setError(error instanceof Error ? error.message : 'Unknown error');
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchWatchlists();
// //   }, []);

// //   if (loading) {
// //     return (
// //       <View style={styles.loader}>
// //         <ActivityIndicator size="large" color="#808080" />
// //         <Text>Loading watchlists...</Text>
// //       </View>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <View style={styles.errorContainer}>
// //         <Text style={styles.errorText}>Failed to load watchlists: {error}</Text>
// //       </View>
// //     );
// //   }

// //   if (!watchlists || watchlists.length === 0) {
// //     return (
// //       <View style={styles.errorContainer}>
// //         <Text style={styles.errorText}>No watchlists available</Text>
// //       </View>
// //     );
// //   }

// //   const currentWatchlist = watchlists[currentIndex];

// //   return (
// //     <View style={styles.container}>
// //       {/* Navigation Buttons */}
// //       <View style={styles.navContainer}>
// //         <TouchableOpacity
// //           onPress={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
// //           disabled={currentIndex === 0}
// //           style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
// //         >
// //           <Text style={styles.navText}>◀</Text>
// //         </TouchableOpacity>
// //         <Text style={styles.title}>{currentWatchlist.name}</Text>
// //         <TouchableOpacity
// //           onPress={() => setCurrentIndex((prev) => Math.min(prev + 1, watchlists.length - 1))}
// //           disabled={currentIndex === watchlists.length - 1}
// //           style={[styles.navButton, currentIndex === watchlists.length - 1 && styles.disabledButton]}
// //         >
// //           <Text style={styles.navText}>▶</Text>
// //         </TouchableOpacity>
// //       </View>

// //       {/* Watchlist Symbols */}
// //       <ScrollView style={styles.symbolList}>
// //         {currentWatchlist.symbols.map((symbol, index) => (
// //           <View key={index} style={styles.symbolItem}>
// //             <Text style={styles.symbolText}>{symbol}</Text>
// //           </View>
// //         ))}
// //       </ScrollView>
// //     </View>
// //   );
// // };

// // export default WatchlistScreen;

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     padding: 16,
// //     backgroundColor: '#f5f5f5',
// //   },
// //   title: {
// //     fontSize: 24,
// //     fontWeight: 'bold',
// //     marginBottom: 10,
// //     color: '#333',
// //     textAlign: 'center',
// //   },
// //   loader: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   errorContainer: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   errorText: {
// //     color: 'red',
// //     fontSize: 16,
// //   },
// //   navContainer: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     marginBottom: 20,
// //   },
// //   navButton: {
// //     padding: 10,
// //     backgroundColor: '#007bff',
// //     borderRadius: 5,
// //   },
// //   disabledButton: {
// //     backgroundColor: '#d3d3d3',
// //   },
// //   navText: {
// //     fontSize: 20,
// //     color: 'white',
// //   },
// //   symbolList: {
// //     marginTop: 10,
// //   },
// //   symbolItem: {
// //     padding: 10,
// //     backgroundColor: '#fff',
// //     marginBottom: 8,
// //     borderRadius: 8,
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 4,
// //     elevation: 3,
// //   },
// //   symbolText: {
// //     fontSize: 18,
// //     fontWeight: 'bold',
// //     color: '#007bff',
// //   },
// // });
