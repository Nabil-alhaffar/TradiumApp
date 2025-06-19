import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface LivePriceBannerProps {
  symbol: string;
  exchange: string;
  livePrice: number;
  change: number;
  changePercent: number;
  assetClass?: string;
  compact?: boolean;
}

const LivePriceBanner: React.FC<LivePriceBannerProps> = ({ symbol, exchange, livePrice, change, changePercent, assetClass, compact }) => {
  const getPriceColor = () => {
    if (change > 0) return '#4CAF50';
    if (change < 0) return '#FF5252';
    return '#FFF';
  };

  if (compact) {
    return (
      <View style={styles.compactBanner}>
        <Text style={styles.compactSymbol}>{symbol}</Text>
        {assetClass && (
          <Text style={styles.compactAssetClass}>
            <Text style={{ fontStyle: 'italic', color: '#AAA' }}>({assetClass.replace(/-/g, ' ').toUpperCase()})</Text>
          </Text>
        )}
        <Text style={styles.compactExchange}>{exchange}</Text>
        <Text style={[styles.compactPrice, { color: getPriceColor() }]}>${livePrice.toFixed(2)}</Text>
        <Text style={[styles.compactChange, { color: getPriceColor() }]}> {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)</Text>
      </View>
    );
  }

  return (
    <View style={styles.banner}>
      <View style={styles.leftSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.symbol}>{symbol}</Text>
          {assetClass && (
            <Text style={styles.assetClass}>
              <Text style={{ fontStyle: 'italic', color: '#AAA' }}>({assetClass.replace(/-/g, ' ').toUpperCase()})</Text>
            </Text>
          )}
        </View>
        <Text style={styles.exchange}>{exchange}</Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={[styles.price, { color: getPriceColor() }]}>
          ${livePrice.toFixed(2)}
        </Text>
        <Text style={[styles.change, { color: getPriceColor() }]}> 
          {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#23272F',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginTop: 16,
    marginLeft: 16,
    minWidth: 340,
    maxWidth: 480,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    zIndex: 2000,
    ...(Platform.OS === 'web' ? { position: 'relative' } : {}),
  },
  leftSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  rightSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  symbol: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  assetClass: {
    color: '#AAA',
    fontSize: 15,
    fontStyle: 'italic',
    marginLeft: 6,
    opacity: 0.95,
  },
  exchange: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  change: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Compact styles
  compactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23272F',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 0,
    minHeight: 38,
    width: '100%',
    position: 'relative',
    zIndex: 3000,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  compactSymbol: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 6,
  },
  compactAssetClass: {
    color: '#AAA',
    fontSize: 13,
    fontStyle: 'italic',
    marginRight: 6,
  },
  compactExchange: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 10,
  },
  compactPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 6,
  },
  compactChange: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LivePriceBanner; 