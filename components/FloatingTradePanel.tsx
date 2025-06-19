import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { connectToMarketData, joinSymbolGroup, leaveSymbolGroup, registerQuoteListener, removeQuoteListener } from '../app/services/SignalRService';
import axiosInstance from '../app/services/AxiosInstance';

interface Position {
  symbol: string;
  quantity: number;
  positionRatio: number;
  type: string;
  averagePurchasePrice: number;
  totalCost: number;
  marketValue: number;
}

interface QuoteData {
  high: number;
  low: number;
  lastPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

interface FloatingTradePanelProps {
  symbol: string;
  currentPrice: number;
  onTrade: (type: string, quantity: string) => void;
  userId: string | null;
  position?: Position | null;
  quote?: QuoteData | null;
  assetClass?: string;
}

interface QuoteUpdate {
  S: string;    // Symbol
  ap: number;   // Ask Price
  bp: number;   // Bid Price
  as: number;   // Ask Size
  bs: number;   // Bid Size
  t: string;    // Timestamp
}

const FloatingTradePanel: React.FC<FloatingTradePanelProps> = ({
  symbol,
  currentPrice,
  onTrade,
  userId,
  position,
  quote,
  assetClass,
}) => {
  const [livePrice, setLivePrice] = useState<number>(currentPrice);
  const [quantity, setQuantity] = useState('0');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState('');
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [previousPrice, setPreviousPrice] = useState<number>(currentPrice);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const animatedWidth = React.useRef(new Animated.Value(320)).current;

  const orderTypes = ['Buy', 'Sell', 'Short', 'CloseShort'];

  const parseQuote = (raw: QuoteUpdate) => ({
    Symbol: raw.S,
    AskPrice: raw.ap,
    BidPrice: raw.bp,
    AskSize: raw.as,
    BidSize: raw.bs,
    Timestamp: raw.t,
  });

  useEffect(() => {
    const handleQuote = (rawQuote: QuoteUpdate) => {
      if (rawQuote.S === symbol) {
        const quote = parseQuote(rawQuote);
        const midPrice = (quote.AskPrice + quote.BidPrice) / 2;
        setPreviousPrice(livePrice);
        setLivePrice(midPrice);
        const change = midPrice - currentPrice;
        const changePercent = (change / currentPrice) * 100;
        setPriceChange(change);
        setPriceChangePercent(changePercent);
      }
    };

    const setupSignalR = async () => {
      try {
        await connectToMarketData();
        registerQuoteListener(handleQuote);
        
        if (userId) {
          await axiosInstance.post(`/symbolsubscription/${userId}/subscribe-to-symbol/${symbol}`);
          await joinSymbolGroup(symbol);
        }
      } catch (error) {
        console.error('Error setting up SignalR:', error);
      }
    };

    setupSignalR();

    return () => {
      if (userId) {
        leaveSymbolGroup(symbol).catch(console.error);
      }
      removeQuoteListener(handleQuote);
    };
  }, [symbol, userId, currentPrice]);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: isCollapsed ? 40 : 320,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isCollapsed]);

  const getPriceColor = () => {
    if (livePrice > previousPrice) return '#4CAF50';
    if (livePrice < previousPrice) return '#FF5252';
    return '#FFF';
  };

  return (
    <Animated.View style={[styles.container, { width: animatedWidth }]}>
      {/* Collapse/Expand Toggle Button */}
      <TouchableOpacity
        style={styles.collapseButton}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <Text style={styles.collapseIcon}>{isCollapsed ? '▶' : '◀'}</Text>
        {isCollapsed && (
          <Text style={styles.collapseText}>Expand Trading Panel</Text>
        )}
      </TouchableOpacity>
      {/* Only render the rest if not collapsed */}
      {!isCollapsed && (
        <>
          {/* Ticker and Asset Class */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <Text style={styles.symbolText}>{symbol}</Text>
            {assetClass && (
              <Text style={styles.assetClass}>
                <Text style={{ fontStyle: 'italic', color: '#AAA' }}>({assetClass.replace(/-/g, ' ').toUpperCase()})</Text>
              </Text>
            )}
          </View>
          {/* Quote Data Section */}
          {quote && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quote</Text>
              <View style={styles.row}>
                <Text style={styles.label}>High:</Text>
                <Text style={styles.value}>${quote.high.toFixed(2)}</Text>
                <Text style={styles.label}>Low:</Text>
                <Text style={styles.value}>${quote.low.toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Last:</Text>
                <Text style={styles.value}>${quote.lastPrice.toFixed(2)}</Text>
                <Text style={styles.label}>Prev Close:</Text>
                <Text style={styles.value}>${quote.previousClose.toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Change:</Text>
                <Text style={[styles.value, { color: quote.change >= 0 ? '#4CAF50' : '#FF5252' }]}>
                  {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)}
                </Text>
                <Text style={styles.label}>%</Text>
                <Text style={[styles.value, { color: quote.changePercent >= 0 ? '#4CAF50' : '#FF5252' }]}>
                  {quote.changePercent.toFixed(2)}%
                </Text>
              </View>
            </View>
          )}
          {/* Position Section */}
          {position && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Position</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Qty:</Text>
                <Text style={styles.value}>{position.quantity}</Text>
                <Text style={styles.label}>Type:</Text>
                <Text style={styles.value}>{position.type}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Avg Price:</Text>
                <Text style={styles.value}>${position.averagePurchasePrice.toFixed(2)}</Text>
                <Text style={styles.label}>Cost:</Text>
                <Text style={styles.value}>${position.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Market Value:</Text>
                <Text style={styles.value}>${position.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
            </View>
          )}
          {/* Live Price Section */}
          <View style={styles.priceContainer}>
            <Text style={[styles.priceText, { color: getPriceColor() }]}>${livePrice.toFixed(2)}</Text>
            <View style={styles.changeContainer}>
              <Text style={[styles.changeText, { color: priceChange >= 0 ? '#4CAF50' : '#FF5252' }]}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </Text>
            </View>
          </View>
          {/* Trade Controls */}
          <View style={styles.quantityContainer}>
            <Text style={styles.label}>Quantity:</Text>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Enter quantity"
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.buttonContainer}>
            {orderTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.tradeButton, { backgroundColor: type.includes('Buy') ? '#4CAF50' : '#FF5252' }]}
                onPress={() => onTrade(type, quantity)}
              >
                <Text style={styles.buttonText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Platform.OS === 'web' ? 20 : 10,
    top: Platform.OS === 'web' ? 100 : 80,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    ...(Platform.OS === 'web' ? {
      pointerEvents: 'auto',
      cursor: 'auto',
    } : {}),
  },
  collapseButton: {
    position: 'absolute',
    left: -18,
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    backgroundColor: '#23272F',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  collapseIcon: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  collapseText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 90,
  },
  section: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8,
  },
  label: {
    color: '#AAA',
    fontSize: 13,
    marginRight: 2,
  },
  value: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  symbolText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  assetClass: {
    color: '#AAA',
    fontSize: 13,
    fontStyle: 'italic',
    marginLeft: 6,
    opacity: 0.95,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  quantityContainer: {
    marginBottom: 16,
  },
  quantityInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  tradeButton: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
  },
});

export default FloatingTradePanel; 