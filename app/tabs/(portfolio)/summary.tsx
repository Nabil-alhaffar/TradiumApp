
import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import axios from 'axios';
import { fetch } from 'react-native-ssl-pinning';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { tokens } from 'react-native-paper/lib/typescript/styles/themes/v3/tokens';
// Define interfaces for type safety
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
  availableFunds: number;
  positions: { [key: string]: Position };
}
interface PortfolioSummary {
    totalMarketValue: number;
    totalCost: number;
    totalNetValue: number; 
    openPnL : number; 
    percentagePnL: number;
    dayPnL: number; 
    dayPercentagePnL: number; 

}
interface PositionSummary {

    symbol: string,
    quantity: number,
    averagePurchasePrice: number,
    currentPrice: number,
    marketValue: number,
    totalCost: number,
    openPNL: number,
    openPNLPercentage: number
}

let token: string | null = null;
let userId : string| null = null; 

const fetchPositionSummary = async (symbol: string) =>{
    const response = await axios.get(`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/Position/${userId}/get-position-summary/${symbol}`, {
            headers: {
                // Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
    });
    return response.data;
        
}

const PortfolioScreen = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary| null> (null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positionSummaries, setPositionSummaries] = useState<{ [symbol: string]: PositionSummary }>({});

  useEffect(() => {
    const fetchPortfolio = async () => {
        try {
           
            if (Platform.OS === 'web') {
                token = await AsyncStorage.getItem('userToken');
                userId = await AsyncStorage.getItem('userId');
               }
            else {
                token = await SecureStore.getItemAsync('userToken');
                userId = await SecureStore.getItemAsync('userId');
               }
            //    console.log('Fetched userId:', userId);

               const portfolioResponse = await axios.get(`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/portfolio/${userId}`, {
                headers: {
                // Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },


            });
            const portfolioSummaryResponse = await axios.get(`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/portfolio/summary/${userId}`, {
                headers: {
                // Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },

   
            });
            const portfolioData = portfolioResponse.data.portfolio;
            console.log('Fetched Portfolio:', portfolioResponse.data);
            setPortfolio(portfolioResponse.data.portfolio);
            setPortfolioSummary(portfolioSummaryResponse.data);
           // Fetch each position summary
            const summaries: { [symbol: string]: PositionSummary } = {};
            for (const symbol of Object.keys(portfolioData.positions)) {
                const summary = await fetchPositionSummary(symbol);
                summaries[symbol] = summary;
            }
            setPositionSummaries(summaries);
            setLoading(false);
        }   catch (error) {
            console.error('Error fetching portfolio:', error);
        //   setError(error);
        }
    };
  
    fetchPortfolio();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#808080" />
        <Text>Loading portfolio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load portfolio: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Portfolio</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.funds}>Available Funds: ${portfolio?.availableFunds?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</Text>
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>Net Value:</Text>
    <Text style={styles.summaryValue}>${portfolioSummary?.totalNetValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</Text>
  </View>
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>Market Value:</Text>
    <Text style={styles.summaryValue}>${portfolioSummary?.totalMarketValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</Text>
  </View>
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>Cost:</Text>
    <Text style={styles.summaryValue}>${portfolioSummary?.totalCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</Text>
  </View>
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>Today’s +/-:</Text>
    <Text style={[
      styles.summaryValue,
      { color: (portfolioSummary?.dayPnL ?? 0) >= 0 ? '#4caf50' : '#f44336' }
    ]}>
      ${portfolioSummary?.dayPnL?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'} ({portfolioSummary?.dayPercentagePnL?.toFixed(2) ?? '0.00'}%)
    </Text>
  </View>
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>Open +/-:</Text>
    <Text style={[
      styles.summaryValue,
      { color: (portfolioSummary?.openPnL ?? 0) >= 0 ? '#4caf50' : '#f44336' }
    ]}>
      ${portfolioSummary?.openPnL?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'} ({portfolioSummary?.percentagePnL?.toFixed(2) ?? '0.00'}%)
    </Text>
  </View>
</View>

      {portfolio?.positions && Object.keys(portfolio.positions).map((symbol) => {
        const position = portfolio.positions[symbol];
        const summary = positionSummaries[symbol];
        return (
          <View key={position.positionId} style={styles.positionCard}>
            <Text style={styles.symbol}>{position.symbol}</Text>
            <Text>Type: {position.type}</Text>
            <Text>Quantity: {position.quantity}</Text>
            <Text>Avg Price: ${position.averagePurchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text>Current Price: ${position.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text>Market Value: ${position.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text>Total Cost: ${position.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={{ color: summary?.openPNL >= 0 ? '#4caf50' : '#f44336' }}>
            Open PnL: ${summary?.openPNL?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 'Loading...'} ({summary?.openPNLPercentage?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}%)
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default PortfolioScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign:'center'
  },
  funds: {
    fontSize: 18,
    marginBottom: 20,
    color: '#4caf50',
    textAlign:'center'
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#555',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  positionCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  symbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});