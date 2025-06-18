import { ThemedText } from '@/components/ThemedText';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as SignalRService from '../../app/services/SignalRService';
import axiosInstance from '../services/AxiosInstance';
import StockChart from '../../components/StockChart/StockChart'

interface Watchlist {
  watchlistId: string;
  symbols: string[];
  watchlistName: string;
}
// interface SnapshotResponse {
//   snapshots: string; // JSON string that needs parsing
// }

// interface Snapshot {
//   dailyBar?: {
//     c: number; // current day's close (or latest daily price)
//     t: string; // timestamp
//   };
//   prevDailyBar?: {
//     c: number; // previous close
//   };

//   latestQuote?: {
//     ap: number; // ask price
//     bp: number; // bid price
//   };
//   // ... other fields
// }

interface FinnhubQuote{ 
  c: number
  h: number,
  l: number,
  o: number,
  pc: number,
  t: Date
}


interface Quote {
  Symbol: string;
  BidPrice: number;
  AskPrice: number;
}

const parseQuote = (raw: any): Quote => ({
  Symbol: raw.S,
  AskPrice: raw.ap,
  BidPrice: raw.bp,
});

interface PrevCloseData {
  [symbol: string]: number |null;
}
interface CurrentCloseData{
  [symbol: string] :number|null;
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
  const [prevCloses, setPrevCloses] = useState<PrevCloseData >({});
  const [currentCloses, setCurrentCloses] = useState<CurrentCloseData >({});

  // const [chartData, setChartData] = useState<ChartData>({});
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);
  const [showAddSymbol, setShowAddSymbol] = useState(false);

  const handleDeleteWatchlist = async () => {

    
    if (!watchlists || watchlists.length === 0) return;
  
    const watchlistToDelete = watchlists[currentIndex];
    
    try {
      setLoading(true);
      
      await axiosInstance.delete(
        `/watchlists/${userId}/${watchlistToDelete.watchlistId}`
      );
  
      // Refresh the list
      await fetchWatchlistsAndSnapshots();
      
      // Reset current index if we deleted the last item
      setCurrentIndex(prev => {
        // If we deleted the last item, go to previous one
        return prev > 0 ? prev - 1 : 0;
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to delete watchlist');
      console.error('Error deleting watchlist:', error);
    } finally {
      setLoading(false);
    }
  };
  const confirmDelete = () => {
    if (!currentWatchlist) return;
  
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Delete watchlist "${currentWatchlist.watchlistName}"?`
      );
      if (confirmed) handleDeleteWatchlist();
    } else {
      Alert.alert(
        'Confirm Delete',
        `Delete watchlist "${currentWatchlist.watchlistName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', 
            style: 'destructive', 
            onPress: handleDeleteWatchlist 
          }
        ]
      );
    }
  };

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

      const prevCloses: PrevCloseData = {};
      const currentCloses: CurrentCloseData = {};

      if (allSymbols.length > 0) {
        // const snapshotResponse = await axiosInstance.get<SnapshotResponse>(
        //   '/alpaca/snapshots',
        //   {
        //     params: { symbols: allSymbols },
        //   }
        // );
        for (const symbol of allSymbols) {
          const finnhubQuoteResponse = await axiosInstance.get<FinnhubQuote>(
            `/Finnhub/quote/${symbol}`,
            {

            }

          );
          prevCloses[symbol] = finnhubQuoteResponse?.data.pc?? null;
          currentCloses[symbol] = finnhubQuoteResponse?.data.c?? null;

        };
      
        // const parsedSnapshots: Record<string, Snapshot> = JSON.parse(snapshotResponse.data.snapshots);

        setCurrentCloses(currentCloses);
        setPrevCloses(prevCloses);

        await SignalRService.connectToMarketData();
        SignalRService.registerQuoteListener((rawQuote: any) => {
          const parsed = parseQuote(rawQuote);
          setQuotes(prev => {
            // Create a new object to ensure React detects the change
            const newQuotes = {...prev, [parsed.Symbol]: parsed};
            console.log('New quote received:', parsed.Symbol, newQuotes[parsed.Symbol]);
            return newQuotes;
          });
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

  useEffect(() => {
    fetchWatchlistsAndSnapshots();

    return () => {
      SignalRService.disconnect();
    };
  }, []);

  const handleAddWatchlist = async () => {
    if (!newWatchlistName.trim()) {
      Alert.alert('Error', 'Please enter a watchlist name');
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/watchlists/${userId}`,
        { watchlistName: newWatchlistName }
      );

      const newWatchlist: Watchlist = response.data;

      setWatchlists(prev => {
        const updated = [...(prev || []), newWatchlist];
        setCurrentIndex(updated.length - 1); // select new one
        return updated;
      });
      fetchWatchlistsAndSnapshots();
      setNewWatchlistName('');
      setShowAddWatchlist(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create watchlist');
      console.error('Error creating watchlist:', error);
    }
  };


  

  const handleAddSymbols = async (symbolsToAdd: string[]) => {
    if (!symbolsToAdd || symbolsToAdd.length === 0) {
      Alert.alert('Error', 'Please enter at least one symbol to add');
      return;
    }
  
    if (!watchlists || watchlists.length === 0) {
      Alert.alert('Error', 'No watchlist available to add symbols to');
      return;
    }
  
    const currentWatchlist = watchlists[currentIndex];
    if (!currentWatchlist) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No watchlist selected</Text>
        </View>
      );
    }
  
    try {
      const uppercaseSymbols = symbolsToAdd.map((s) => s.trim().toUpperCase()).filter(Boolean);
  
      await axiosInstance.post(
        `/watchlists/${userId}/${currentWatchlist.watchlistId}/add-symbols`,
        { symbols: uppercaseSymbols }
      );
  
      await fetchWatchlistsAndSnapshots();
      setNewSymbol('');
      setShowAddSymbol(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add symbols to watchlist');
      console.error('Error adding symbols:', error);
    }
  };
  
  const handleRemoveSymbols = async (symbolsToRemove: string[]) => {
    if (!symbolsToRemove || symbolsToRemove.length === 0) {
      Alert.alert('Error', 'Please select at least one symbol to remove');
      return;
    }
  
    if (!watchlists || watchlists.length === 0) return;
  
    const currentWatchlist = watchlists[currentIndex];
  
    try {
      const uppercaseSymbols = symbolsToRemove.map((s) => s.trim().toUpperCase()).filter(Boolean);
  
      console.log('currentIndex:', currentIndex);
      console.log('watchlists:', watchlists);
      console.log('currentWatchlist:', currentWatchlist);
         // Leave SignalR groups for removed symbols
    for (const symbol of symbolsToRemove) {
      await SignalRService.leaveSymbolGroup(symbol.toUpperCase());
    }
      await axiosInstance.post(
        `/watchlists/${userId}/${currentWatchlist.watchlistId}/remove-symbols`,
        { symbols: uppercaseSymbols }
      );
  
      await fetchWatchlistsAndSnapshots();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove symbols from watchlist');
      console.error('Error removing symbols:', error);
    }
  };

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
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You don't have any watchlists yet</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddWatchlist(true)}
        >
          <Text style={styles.addButtonText}>Create New Watchlist</Text>
        </TouchableOpacity>

        {showAddWatchlist && (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Enter watchlist name"
              placeholderTextColor="#999"
              value={newWatchlistName}
              onChangeText={setNewWatchlistName}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowAddWatchlist(false)}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.submitButton]}
                onPress={handleAddWatchlist}
              >
                <Text style={styles.actionButtonText}>Create</Text>
              </TouchableOpacity>

            </View>
          </View>
        )}
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
        <Text style={styles.title}>{currentWatchlist.watchlistName}</Text>
        <TouchableOpacity
          onPress={() => setCurrentIndex(prev => Math.min(prev + 1, watchlists.length - 1))}
          disabled={currentIndex === watchlists.length - 1}
          style={[styles.navButton, currentIndex === watchlists.length - 1 && styles.disabledButton]}
        >
          <Text style={styles.navText}>▶</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddWatchlist(true)}
        >
          <Text style={styles.addButtonText}>+ Watchlist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddSymbol(true)}
        >
          <Text style={styles.addButtonText}>+ Symbol</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
           confirmDelete();
          }}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {(showAddWatchlist || showAddSymbol) && (
        <View style={styles.addForm}>
          {showAddWatchlist && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter watchlist name"
                placeholderTextColor="#999"
                value={newWatchlistName}
                onChangeText={setNewWatchlistName}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setShowAddWatchlist(false)}
                >
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.submitButton]}
                  onPress={handleAddWatchlist}
                >
                  <Text style={styles.actionButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {showAddSymbol && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter symbol (e.g., AAPL)"
                placeholderTextColor="#999"
                value={newSymbol}
                onChangeText={setNewSymbol}
                autoCapitalize="characters"
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setShowAddSymbol(false)}
                >
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.submitButton]}
                  onPress={() => handleAddSymbols([newSymbol])} 
                >
                  <Text style={styles.actionButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

     <ScrollView style={styles.symbolList}>
        {!currentWatchlist?.symbols || currentWatchlist.symbols.length === 0 ? (
          <View style={styles.emptySymbolsContainer}>
            <Text style={styles.emptySymbolsText}>No symbols in this watchlist</Text>
          </View>
          ) : (
          currentWatchlist.symbols.map((symbol, index) => {
            const quote = quotes[symbol];
            const prevClose = prevCloses[symbol];
            const currentClose = currentCloses[symbol];
            const realTimePrice = quote ? (quote.AskPrice + quote.BidPrice) / 2 : null;
            const fallbackPrice = currentClose  ?? null;

            
            // const fallbackPrice = prevClose ?? null;
            const price = realTimePrice ?? fallbackPrice;

            let changePercent = null;
            if (price != null && prevClose != null) {
              changePercent = ((price - prevClose) / prevClose) * 100;
            }

            const displayPrice = price?.toFixed(2) ?? '-';
            const displayChange = changePercent != null ? `${changePercent.toFixed(2)}%` : '-';
            const color =
              changePercent == null|| changePercent ==0
                ? '#fff'
                : changePercent > 0
                ? '#4CAF50'
                : '#F44336';

            return (
              <View key={index} style={styles.symbolItem}>
                <View style={styles.symbolHeader}>
                  <Text style={styles.symbolText}>{symbol}</Text>
                  {/* <View style={styles.chartContainer}> */}
                  < StockChart  symbol= {symbol} timeframe='1W' chartType='line' height={110} limit={25} zoomBtnsEnabled= {false} pathColor={color}/>
                  {/* </View> */}
          
                  <Text style={[styles.price , { color }]}>{displayPrice} ({displayChange})</Text>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveSymbols([symbol])}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#ccc', fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ff4d4d', fontSize: 16 },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptySymbolsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySymbolsText: {
    color: '#ccc',
    fontSize: 16,
  },
  navContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    gap: 10,
    paddingHorizontal: 5,
  },
  navButton: {
    padding: 12,
    backgroundColor: '#2a52be',
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
    shadowColor: '#1e90ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#4169e1',
  },
  disabledButton: { 
    backgroundColor: '#2a2a2a',
    borderColor: '#404040',
    shadowOpacity: 0.1,
  },
  navText: { 
    fontSize: 18, 
    color: '#fff',
    fontWeight: '600',
  },
  symbolList: { marginTop: 10 },
  symbolItem: {
    position:'relative',
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
  symbolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  symbolText: { fontSize: 25, fontWeight: 'bold', color: '#FFD700', paddingRight:70 },
  price:{paddingLeft:300, padding:10 ,fontWeight:'bold'},
  addButton: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e90ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  addForm: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
    borderColor: '#2563eb',
  },
  cancelButton: {
    backgroundColor: '#7f1d1d',
    borderColor: '#991b1b',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 8,
    padding: 8,
    zIndex: 1,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#ff4d4d',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#7f1d1d',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#991b1b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // chartContainer:{
  //   maxWidth:200,
  //   flex:1,
  //   width:200
  // }
});

export default WatchlistScreen;
