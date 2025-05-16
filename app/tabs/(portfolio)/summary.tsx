import { ScrollView, StyleSheet, View, Text, ActivityIndicator, Platform, RefreshControl, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';


interface Position {
  userId: string;
  positionId: string;
  quantity: number;
  averagePurchasePrice: number;
  symbol: string;
  type: string;
  positionRatio: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
}

interface Portfolio {
  portfolioId: number;
  availableFunds: number;
  positions: { [key: string]: Position };
}

interface PortfolioSummary {
  totalMarketValue: number;
  totalCost: number;
  totalNetValue: number;
  openPnL: number;
  percentagePnL: number;
  dayPnL: number;
  dayPercentagePnL: number;
}

interface PositionSummary {
  symbol: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  openPNL: number;
  openPNLPercentage: number;
}

let token: string | null = null;
let userId: string | null = null;

const fetchPositionSummary = async (symbol: string) => {
  const response = await axios.get(`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/Position/${userId}/get-position-summary/${symbol}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};



const PortfolioScreen = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [positionSummaries, setPositionSummaries] = useState<{ [symbol: string]: PositionSummary }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState (false);

  const fetchPortfolio = async () => {
    try {
      token = Platform.OS === 'web'
        ? await AsyncStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');
      userId = Platform.OS === 'web'
        ? await AsyncStorage.getItem('userId')
        : await SecureStore.getItemAsync('userId');

      const [portfolioRes, summaryRes] = await Promise.all([
        axios.get(`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/portfolio/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/portfolio/summary/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setPortfolio(portfolioRes.data.portfolio);
      setPortfolioSummary(summaryRes.data);

      const summaries: { [symbol: string]: PositionSummary } = {};
      for (const symbol of Object.keys(portfolioRes.data.portfolio.positions)) {
        summaries[symbol] = await fetchPositionSummary(symbol);
      }

      setPositionSummaries(summaries);
    } catch (error) {
      setError('Error fetching portfolio.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {

    fetchPortfolio();
  }, []);
  const onRefresh = ()=> {
    setRefreshing(true);
    fetchPortfolio();
  }
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00ffcc" />
        <Text style={styles.text}>Loading portfolio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} 
                refreshControl={
                <RefreshControl refreshing = {refreshing}
                                onRefresh={onRefresh}
                                tintColor="#00ffcc"
                                colors = {['#00ffcc']}/>}>
      {/* <Text style={styles.header}>Portfolio</Text> */}
      {Platform.OS ==='web' && (
      <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color="#ffd700" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      )}
      <View style={[styles.card, { borderLeftColor: '#FFD700' }]}>
        <View style={styles.row}>
          <MaterialIcons name="account-balance-wallet" size={24} color="#FFD700" />
          <Text style={styles.symbol}>Summary</Text>
        </View>
        <Text style={styles.label}>Available Funds: ${portfolio?.availableFunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.label}>Net Value: ${portfolioSummary?.totalNetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.label}>Market Value: ${portfolioSummary?.totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.label}>Cost: ${portfolioSummary?.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={[styles.label, { color: portfolioSummary?.dayPnL >= 0 ? '#00FF00' : '#FF5252' }]}>
          Today's +/-: ${portfolioSummary?.dayPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({portfolioSummary?.dayPercentagePnL.toFixed(2)}%)
        </Text>
        <Text style={[styles.label, { color: portfolioSummary?.openPnL >= 0 ? '#00FF00' : '#FF5252' }]}>
          Open +/-: ${portfolioSummary?.openPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({portfolioSummary?.percentagePnL.toFixed(2)}%)
        </Text>
      </View>

      <Text style={styles.header}>Holdings</Text>

      {Object.values(portfolio?.positions || {}).map((position) => {
        const summary = positionSummaries[position.symbol];
        return (
          <View
            key={position.positionId}
            style={[
              styles.card,
              { borderLeftColor: summary?.openPNL > 0
                               ? '#4CAF50' 
                               : summary.openPNL< 0 
                               ? '#F44336'
                               : '#9E9E9E'},
            ]}
          >
            <View style={styles.row}>
              <MaterialIcons
                  name={
                    summary.openPNL > 0
                      ? 'trending-up'
                      : summary.openPNL < 0
                      ? 'trending-down'
                      : 'trending-neutral'
                  }                size={24}
                  color={
                    summary?.openPNL > 0
                      ? '#4CAF50'    // green
                      : summary?.openPNL < 0
                      ? '#F44336'    // red
                      : '#9E9E9E'    // gray for neutral
                  }              />
              <Text style={styles.symbol}>{position.symbol.toUpperCase()}</Text>
              <Text style={styles.type}>
                {position.type.toUpperCase()} x {position.quantity}
              </Text>
            </View>
            <Text style={styles.price}>Avg Price: ${position.averagePurchasePrice.toFixed(2)}</Text>
            <Text style={styles.price}>Current: ${position.currentPrice.toFixed(2)}</Text>
            <Text style={styles.price}>Market Value: ${position.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={[styles.price, { color: summary?.openPNL > 0 
                                        ? '#00FF00' 
                                        : summary.openPNL < 0 
                                        ? '#FF5252' 
                                        : '#9E9E9E'}]}>
              Open PnL: ${summary?.openPNL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({summary?.openPNLPercentage.toFixed(2)}%)
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default PortfolioScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 16, marginTop:16, textAlign: 'center' },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  symbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
    flex: 1,
  },
  type: {
    fontSize: 14,
    color: '#AAA',
  },
  price: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 2,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 16,
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#888',
  },
  refreshButton: {
    position:'absolute',
    top:20,
    right:20,
    zIndex:1000,
    flexDirection: 'row',
    alignItems:'center',
    marginBottom: 10,
  },
  refreshText: {
    color: '#ffd700',
    marginLeft: 6,
    fontSize: 16,
  },
});
