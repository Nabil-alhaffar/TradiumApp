import { ScrollView, StyleSheet, View, Text, ActivityIndicator, Platform, RefreshControl, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import axiosInstance from '@/app/services/AxiosInstance';


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
  marketValue: number;
  cost: number;
  cashBalance: number;
  netAccountValue: number;
  openPNL: number;
  openReturnPercentage: number;
  dayPNL: number;
  dayReturnPercentage: number;
  marginUsed: number;
  marginLimit: number;
  buyingPower: number;
  equity: number;
  isInMarginCall: boolean;
  maintenanceMarginRequirement: number;
  initialMarginRequirement: number;
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
  const response = await axiosInstance.get(`/Position/${userId}/get-position-summary/${symbol}`);
  return response.data;
};



const PortfolioScreen = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [positionSummaries, setPositionSummaries] = useState<{ [symbol: string]: PositionSummary }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState (false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    try {
      token = Platform.OS === 'web'
        ? await AsyncStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');
      userId = Platform.OS === 'web'
        ? await AsyncStorage.getItem('userId')
        : await SecureStore.getItemAsync('userId');

      const [portfolioRes, summaryRes, profileRes] = await Promise.all([
        axiosInstance.get(`/portfolio/${userId}`),
        axiosInstance.get(`/portfolio/summary/${userId}`),
        axiosInstance.get('/user/profile').catch(() => ({ data: { kycStatus: null } }))
      ]);

      setPortfolio(portfolioRes.data.portfolio);

      const apiSummary = summaryRes.data;
      const mappedSummary: PortfolioSummary = {
        marketValue: apiSummary.totalMarketValue ?? 0,
        cost: apiSummary.totalCost ?? 0,
        cashBalance: portfolioRes?.data?.portfolio?.availableFunds ?? 0,
        netAccountValue: apiSummary.totalNetValue ?? 0,
        openPNL: apiSummary.openPnL ?? 0,
        openReturnPercentage: apiSummary.percentagePnL ?? 0,
        dayPNL: apiSummary.dayPnL ?? 0,
        dayReturnPercentage: apiSummary.dayPercentagePnL ?? 0,
        marginUsed: apiSummary.marginUsed ?? 0,
        marginLimit: apiSummary.marginLimit ?? 0,
        buyingPower: apiSummary.buyingPower ?? 0,
        equity: apiSummary.equity ?? 0,
        isInMarginCall: apiSummary.isInMarginCall ?? false,
        maintenanceMarginRequirement: apiSummary.maintenanceMarginRequirement ?? 0,
        initialMarginRequirement: apiSummary.initialMarginRequirement ?? 0,
      };

      setPortfolioSummary(mappedSummary);
      setKycStatus(profileRes.data.kycStatus);

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
      
      {/* KYC Status Warning */}
      {kycStatus && kycStatus !== 'Verified' && (
        <View style={[styles.card, { borderLeftColor: '#FF9800', backgroundColor: '#2A1A00' }]}>
          <View style={styles.row}>
            <MaterialIcons name="warning" size={24} color="#FF9800" />
            <Text style={styles.symbol}>KYC Verification Required</Text>
          </View>
          <Text style={[styles.label, { color: '#FFB74D' }]}>
            {kycStatus === 'PendingReview' 
              ? 'Your KYC is under review. Trading is restricted until verification is complete.'
              : 'Please complete KYC verification to start trading. Click the Account tab to begin.'}
          </Text>
        </View>
      )}

      <View style={[styles.card, { borderLeftColor: '#FFD700' }]}>
        <View style={styles.row}>
          <MaterialIcons name="account-balance-wallet" size={24} color="#FFD700" />
          <Text style={styles.symbol}>Summary</Text>
        </View>
        <Text style={styles.label}>Available Funds: ${portfolio?.availableFunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.label}>Net Account Value: ${portfolioSummary?.netAccountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.label}>Market Value: ${portfolioSummary?.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.label}>Cost: ${portfolioSummary?.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.label}>Buying Power: ${portfolioSummary?.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.label}>Equity: ${portfolioSummary?.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.label}>Margin Used / Limit: ${portfolioSummary?.marginUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${portfolioSummary?.marginLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.label}>Maint. Req / Initial Req: {(portfolioSummary?.maintenanceMarginRequirement ?? 0) * 100}% / {(portfolioSummary?.initialMarginRequirement ?? 0) * 100}%</Text>
        <Text style={[styles.label, { color: (portfolioSummary?.dayPNL ?? 0) >= 0 ? '#00FF00' : '#FF5252' }]}>
          Today's +/-: ${portfolioSummary?.dayPNL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({portfolioSummary?.dayReturnPercentage.toFixed(2)}%)
        </Text>
        <Text style={[styles.label, { color: (portfolioSummary?.openPNL ?? 0) >= 0 ? '#00FF00' : '#FF5252' }]}>
          Open +/-: ${portfolioSummary?.openPNL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({portfolioSummary?.openReturnPercentage.toFixed(2)}%)
        </Text>
      </View>

      {portfolioSummary?.isInMarginCall && (
        <View style={[styles.card, { borderLeftColor: '#F44336' }]}>
          <View style={styles.row}>
            <MaterialIcons name="warning" size={24} color="#F44336" />
            <Text style={styles.symbol}>Margin Call</Text>
          </View>
          <Text style={[styles.label, { color: '#FF5252' }]}>Your equity has fallen below the maintenance requirement. Liquidate positions or add funds.</Text>
        </View>
      )}

      <Text style={styles.header}>Holdings</Text>

      {Object.values(portfolio?.positions || {}).map((position) => {
        const summary = positionSummaries[position.symbol];
        const openPnLValue = summary?.openPNL ?? 0;
        const openPnLPct = summary?.openPNLPercentage ?? 0;
        const trendColor = openPnLValue > 0 ? '#4CAF50' : openPnLValue < 0 ? '#F44336' : '#9E9E9E';
        const trendIcon = openPnLValue > 0 ? 'trending-up' : openPnLValue < 0 ? 'trending-down' : 'trending-neutral';
        return (
          <View
            key={position.positionId}
            style={[
              styles.card,
              { borderLeftColor: trendColor },
            ]}
          >
            <View style={styles.row}>
              <MaterialIcons
                name={trendIcon}
                size={24}
                color={trendColor}
              />
              <Text style={styles.symbol}>{position.symbol.toUpperCase()}</Text>
              <Text style={styles.type}>
                {position.type.toUpperCase()} x {position.quantity}
              </Text>
            </View>
            <Text style={styles.price}>Avg Price: ${position.averagePurchasePrice.toFixed(2)}</Text>
            <Text style={styles.price}>Current: ${position.currentPrice.toFixed(2)}</Text>
            <Text style={styles.price}>Market Value: ${position.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={[styles.price, { color: openPnLValue > 0 ? '#00FF00' : openPnLValue < 0 ? '#FF5252' : '#9E9E9E' }]}>
              Open PnL: ${openPnLValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({openPnLPct.toFixed(2)}%)
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
