import { ThemedText } from '@/components/ThemedText';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as SignalRService from '../../app/services/SignalRService';
import axiosInstance from '../services/AxiosInstance';
import StockChart from '../../components/StockChart/StockChart'
import { debounce } from 'lodash';
import { Portal, Provider as PaperProvider } from 'react-native-paper';
import { useSymbolSearch } from '../../hooks/useSymbolSearch';
import { MaterialIcons } from '@expo/vector-icons';

interface Watchlist {
  watchlistId: string;
  symbols: string[];
  watchlistName: string;
}
// interface SnapshotResponse {
//   snapshots: string; // JSON string that needs parsing
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

interface StockSuggestion {
  symbol: string;
  name: string;
  assetClass: string;
  exchange: string;
}

interface AssetInfo {
  symbol: string;
  name: string;
  class: string;
  exchange: string;
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<StockSuggestion | null>(null);
  const searchInputRef = React.useRef<any>(null);
  const [inputWindowLayout, setInputWindowLayout] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const { suggestions: searchSuggestions, search } = useSymbolSearch();
  const [assetInfoMap, setAssetInfoMap] = useState<Record<string, AssetInfo>>({});

  // Reset inputWindowLayout when switching watchlists
  React.useEffect(() => {
    setInputWindowLayout(null);
  }, [currentIndex]);

  // Helper to measure input position in window
  const measureInput = () => {
    const input = searchInputRef.current;
    if (input && typeof input.measureInWindow === 'function') {
      input.measureInWindow((x: number, y: number, width: number, height: number) => {
        setInputWindowLayout({ x, y, width, height });
      });
    }
  };

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

  const handleSearchChange = (text: string) => {
    setNewSymbol(text);
    setSelectedSuggestion(null);
    search(text);
    setShowSuggestions(true);
  };

  const handleSuggestionPress = async (suggestion: StockSuggestion) => {
    setNewSymbol('');
    setSelectedSuggestion(suggestion);
    setShowSuggestions(false);
    // Immediately add the symbol to the watchlist
    await handleAddSymbols([suggestion.symbol]);
  };

  const currentWatchlist = (watchlists ?? [])[currentIndex];

  // Fetch asset info for all symbols in the current watchlist
  useEffect(() => {
    const fetchAssetInfo = async () => {
      if (!currentWatchlist?.symbols) return;
      const missingSymbols = currentWatchlist.symbols.filter(
        (symbol) => !assetInfoMap[symbol]
      );
      if (missingSymbols.length === 0) return;
      const newInfo: Record<string, AssetInfo> = {};
      await Promise.all(
        missingSymbols.map(async (symbol) => {
          try {
            const resp = await axiosInstance.get(`/alpaca/asset/${symbol}`);
            console.log(`Asset API response for ${symbol}:`, resp.data);
            console.log(`Response structure for ${symbol}:`, {
              hasData: !!resp.data,
              dataKeys: resp.data ? Object.keys(resp.data) : [],
              classValue: resp.data?.class,
              nameValue: resp.data?.name,
              exchangeValue: resp.data?.exchange
            });
            newInfo[symbol] = {
              symbol,
              name: resp.data.name || resp.data.symbol || '',
              class: resp.data.class || '',
              exchange: resp.data.exchange || '',
            };
            console.log(`Stored asset info for ${symbol}:`, newInfo[symbol]);
          } catch (e) {
            console.log(`Error fetching asset info for ${symbol}:`, e);
            // fallback: just show symbol
            newInfo[symbol] = { symbol, name: '', class: '', exchange: '' };
          }
        })
      );
      setAssetInfoMap((prev) => ({ ...prev, ...newInfo }));
    };
    fetchAssetInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWatchlist]);

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
          style={styles.addIconButton}
          onPress={() => setShowAddWatchlist(true)}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setCurrentIndex(prev => Math.min(prev + 1, watchlists.length - 1))}
          disabled={currentIndex === watchlists.length - 1}
          style={[styles.navButton, currentIndex === watchlists.length - 1 && styles.disabledButton]}
        >
          <Text style={styles.navText}>▶</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteIconButton}
          onPress={() => {
            confirmDelete();
          }}
        >
          <MaterialIcons name="delete" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Always-visible search bar above the watchlists */}
      <View style={{ position: 'relative', marginBottom: 16 }}>
        <TextInput
          ref={searchInputRef}
          style={styles.input}
          placeholder="Search by symbol or company name"
          placeholderTextColor="#999"
          value={newSymbol}
          onChangeText={handleSearchChange}
          autoCapitalize="characters"
          onFocus={() => {
            setShowSuggestions(true);
            measureInput();
          }}
          onSubmitEditing={() => setShowSuggestions(false)}
          onLayout={measureInput}
        />
        <Portal>
          {showSuggestions &&
            searchSuggestions.length > 0 &&
            inputWindowLayout &&
            typeof inputWindowLayout.x === 'number' &&
            typeof inputWindowLayout.y === 'number' &&
            typeof inputWindowLayout.width === 'number' &&
            typeof inputWindowLayout.height === 'number' &&
            isFinite(inputWindowLayout.x) &&
            isFinite(inputWindowLayout.y) &&
            isFinite(inputWindowLayout.width) &&
            isFinite(inputWindowLayout.height) && (
              <View style={{
                position: 'absolute',
                top: inputWindowLayout.y + inputWindowLayout.height + 4,
                left: inputWindowLayout.x,
                width: inputWindowLayout.width,
                backgroundColor: 'rgba(30,30,30,0.92)',
                borderRadius: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                zIndex: 3000,
                maxHeight: 300,
                alignSelf: 'center',
              }}>
                <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
                  {searchSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.symbol}
                      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#333' }}
                      onPress={() => handleSuggestionPress(suggestion)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#FFD700', fontSize: 16, fontWeight: 'bold' }}>{suggestion.symbol}</Text>
                        <Text style={{ color: '#AAA', fontSize: 12, fontStyle: 'italic', marginLeft: 6 }}>
                          ({suggestion.assetClass.replace(/-/g, ' ').toUpperCase()})
                        </Text>
                        <Text style={{ color: '#4CAF50', fontSize: 12, marginLeft: 6 }}>{suggestion.exchange}</Text>
                      </View>
                      <Text style={{ color: '#AAA', fontSize: 13, marginTop: 2 }}>{suggestion.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
        </Portal>
      </View>

      {(showAddWatchlist) && (
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
            const asset = assetInfoMap[symbol];
            console.log(`Asset info for ${symbol} in render:`, asset);
            return (
              <View key={index} style={styles.symbolItem}>
                <View style={styles.symbolHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text style={styles.symbolText}>{symbol}</Text>
                      {asset?.class ? (
                        <Text style={{ fontStyle: 'italic', color: '#AAA', fontSize: 13, marginLeft: 8 }}>
                          {asset.class.replace(/-/g, ' ').toUpperCase()}
                        </Text>
                      ) : null}
                      {asset?.exchange ? (
                        <Text style={{ color: '#4CAF50', fontSize: 13, marginLeft: 8 }}>
                          {asset.exchange}
                        </Text>
                      ) : null}
                    </View>
                    {asset?.name ? (
                      <Text style={{ color: '#AAA', fontSize: 13, marginLeft: 2, marginTop: 2 }} numberOfLines={1}>
                        {asset.name}
                      </Text>
                    ) : null}
                  </View>
                  <StockChart  symbol={symbol} timeframe='1W' chartType='line' height={110} limit={25} zoomBtnsEnabled={false} pathColor={color} />
                  <Text style={[styles.price, { color }]}>{displayPrice} ({displayChange})</Text>
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
  },
  navButton: {
    padding: 10,
    backgroundColor: '#1e90ff',
    borderRadius: 8,
  },
  disabledButton: { backgroundColor: '#555' },
  navText: { fontSize: 20, color: '#fff' },
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
    // borderColor: '#2E8B57',
    borderWidth: 2,
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
    backgroundColor: '#1e90ff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addForm: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderColor: '#2E8B57',
    borderWidth: 2,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderColor: '#2E8B57',
    borderWidth: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  // actionButton: {
  //   flex: 1,
  //   padding: 10,
  //   borderRadius: 5,
  //   alignItems: 'center',
  //   marginHorizontal: 5,
  // },
  submitButton: {
    backgroundColor: '#1e90ff',
    borderWidth: 1,
    borderColor: '#4ba3ff',
  },
  cancelButton: {
    backgroundColor: '#ff4d4d',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,

  },
  removeButton: {
    position: 'absolute',
    top:0,
    right:8,
    padding:5,
    zIndex:1
  },
  removeButtonText: {
    color: '#ff4d4d',
    fontSize: 20,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // chartContainer:{
  //   maxWidth:200,
  //   flex:1,
  //   width:200
  // }
  addIconButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 50,
    padding: 6,
    marginLeft: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteIconButton: {
    backgroundColor: '#ff4d4d',
    borderRadius: 50,
    padding: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default function WrappedWatchlistScreen() {
  return (
    <PaperProvider>
      <WatchlistScreen />
    </PaperProvider>
  );
}
