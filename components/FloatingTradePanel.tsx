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
} from 'react-native';
import { connectToMarketData, joinSymbolGroup, leaveSymbolGroup, registerQuoteListener, removeQuoteListener } from '../app/services/SignalRService';
import axiosInstance from '../app/services/AxiosInstance';

interface FloatingTradePanelProps {
  symbol: string;
  currentPrice: number;
  onTrade: (type: string, quantity: string) => void;
  userId: string | null;
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
}) => {
  const [livePrice, setLivePrice] = useState<number>(currentPrice);
  const [quantity, setQuantity] = useState('1');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState('');
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [previousPrice, setPreviousPrice] = useState<number>(currentPrice);

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

  const getPriceColor = () => {
    if (livePrice > previousPrice) return '#4CAF50';
    if (livePrice < previousPrice) return '#FF5252';
    return '#FFF';
  };

  return (
    <View style={styles.container}>
      <View style={styles.priceContainer}>
        <Text style={styles.symbolText}>{symbol}</Text>
        <Text style={[styles.priceText, { color: getPriceColor() }]}>
          ${livePrice.toFixed(2)}
        </Text>
        <View style={styles.changeContainer}>
          <Text style={[styles.changeText, { color: priceChange >= 0 ? '#4CAF50' : '#FF5252' }]}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
          </Text>
        </View>
      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Platform.OS === 'web' ? 20 : 10,
    top: Platform.OS === 'web' ? 100 : 80,
    width: 300,
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
  label: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 4,
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
    fontWeight: 'bold',
  },
});

export default FloatingTradePanel; 