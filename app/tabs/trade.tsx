import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  Platform,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
// import PortfolioScreen from './portfolio';
import Toast from 'react-native-toast-message';
import { white } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
interface stock {
  symbol: string;
  companyName: string;
  currentPrice: number;
  country: string;
  marketValue: number;
  high52Week: number;
  low52Week: number;
  eps: number;
  stockStatus: string;
  stockSector: string;
  exchange: string;
  movingAverage50Day: number;
  movingAverage200Day: number;
  dividendDate: Date;
  exDividendDate: Date;
  description: string;
  logoURL: string;
  analystTargetPrice: number;
  officialSite: string;
  quote: {
    symbol: string;
    open: number;
    high: number;
    low: number;
    lastPrice: number;
    volume: number;
    latestTradingDay: Date;
    previousClose: number;
    change: number;
    changePercent: number;
  };
  logoUrl: string;
}
interface position {
    symbol: string, 
    quantity: number, 
    positionRatio : number, 
    type: string,
    averagePurchasePrice: number, 
    totalCost: number, 
    marketValue: number
}

const orderTypes = ['Buy', 'Sell', 'Short', 'CloseShort'];

const TradeScreen = () => {
  const [error, setError] = useState<string | null>(null);
  const [searchedSymbol, setSearchedSymbol] = useState('');
  const [stock, setStock] = useState<stock | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState('');
  const [quantity, setQuantity] = useState('1');

  const [isExistingPosition,setIsExistingPosition] = useState (false);  
  const [position, setPosition] = useState <position| null> (null);

  useEffect(() => {
    const getToken = async () => {
      const storedToken = Platform.OS === 'web'
        ? await AsyncStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');
      setToken(storedToken);
    };
    const getUserId = async ()=> {
        const storedUserId = Platform.OS === 'web'
        ? await AsyncStorage.getItem('userId')
        : await SecureStore.getItemAsync('userId');
        setUserId (storedUserId);
    }
    getToken();
    getUserId();
  }, []);

  const fetchStock = async () => {
    try {
      const overviewResponse = await axios.get(
        `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/AlphaVantageStockMarket/getStock/${searchedSymbol}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setStock({
        ...overviewResponse.data.stock,
        dividendDate: overviewResponse.data.stock.dividendDate ? new Date(overviewResponse.data.stock.dividendDate) : null,
        exDividendDate: overviewResponse.data.stock.exDividendDate ? new Date(overviewResponse.data.stock.exDividendDate) : null,
      });
      fetchExistingPosition();

      setError(null);
    } catch (err) {
      console.error('Error fetching stock:', err);
      setError('Stock not found or network issue.');

    }
  };

  const executeTrade = async () => {
    if (!token || !stock || !selectedOrderType) return;

    try {
       const response = await axios.post(
        `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/Stock/execute-trade`,
        {
          symbol: stock.symbol,
          quantity: parseInt(quantity),
          type: selectedOrderType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);
      Toast.show({
        type: 'success',
        text1: `${selectedOrderType} order placed. `,
        text2: `${response.data.message}`,
      });
      Alert.alert('Success', `${selectedOrderType} order placed.: ${response.data.message}` );
      setIsModalVisible(false);
      setSelectedOrderType('');
      setQuantity('1');
      await fetchExistingPosition();

    } catch (err:any) {
      console.error('Trade error:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
      'An unexpected error occurred.';
      Toast.show({
        type: 'error',
        text1:  'Failed to execute trade.',
        text2: `${errorMessage}`,
      });
      Alert.alert('Error', 'Failed to execute trade.');
    }
  };
  const fetchExistingPosition = async () => {
    console.log("fetching position");
  
    try {
      const response = await axios.get(`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/Portfolio/Positions/${userId}/${searchedSymbol}`, {
        headers: { Authorization: `Bearer ${token} ` }
      });
  
      if (response.data) {
        setPosition(response.data);
        setIsExistingPosition(true);
      } else {
        setPosition(null);
        setIsExistingPosition(false);
      }
    } catch (err) {
      console.error("Error fetching position ", err);
      setPosition(null);
      setIsExistingPosition(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.lookUpInterface}>
        <TextInput
          style={styles.inputField}
          onChangeText={setSearchedSymbol}
          placeholder="Symbol/Ticker"
          placeholderTextColor="#aaa"
          value={searchedSymbol}
        />
        <TouchableOpacity style={styles.lookUpButton} onPress={fetchStock}>
          <IconSymbol size={28} name="search" color="#000" />
        </TouchableOpacity>
      </View>

      {stock && (
        <>
          {/* Stock Info Card */}
          <View style={styles.stockCard}>
          {stock.logoURL && (
              <Image
                source={{ uri: stock.logoURL }}
                style={{ width: 100, height: 100, marginTop: 10,marginBottom: 50, alignSelf: 'center'}}
                resizeMode="contain"
              />
            )}
            {Object.entries({
              Symbol: stock.symbol,
              Company: stock.companyName,
              'Current Price': `$${stock.currentPrice}`,
              Country: stock.country,
              'Market Value': stock.marketValue ? `$${stock.marketValue.toLocaleString()}` : 'N/A',
              '52 Week High': `$${stock.high52Week}`,
              '52 Week Low': `$${stock.low52Week}`,
              EPS: stock.eps,
              Status: stock.stockStatus,
              Sector: stock.stockSector,
              Exchange: stock.exchange,
              '50 Day MA': `$${stock.movingAverage50Day}`,
              '200 Day MA': `$${stock.movingAverage200Day}`,
              'Analyst Target Price': `$${stock.analystTargetPrice}`,
              'Official Site': stock.officialSite,
              'Dividend Date': stock.dividendDate ? stock.dividendDate.toLocaleDateString() : 'N/A',
              'Ex-Dividend Date': stock.exDividendDate ? stock.exDividendDate.toLocaleDateString() : 'N/A',
            }).reduce((rows, entry, index) => {
              const rowIndex = Math.floor(index / 3);
              if (!rows[rowIndex]) rows[rowIndex] = [];
              rows[rowIndex].push(entry);
              return rows;
            }, [] as [string, any][][]).map((row, rowIndex) => (
              <View key={rowIndex} style={styles.cardRowMulti}>
                {row.map(([label, value]) => (
                  <View key={label} style={{ flex: 1 }}>
                    <Text style={styles.cardLabel}>{label}</Text>
                    <Text style={styles.cardValue}>{value}</Text>
                  </View>
                ))}
              </View>
            ))}

            <Text style={styles.stockDescription}>{stock.description}</Text>
          </View>
                 
          {/* Quote Card */}
            <View style={styles.stockCard}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, outlineColor:'#FFF', borderColor: '#FFF'}}>Quote Data</Text>
                {Object.entries({
                // Open: stock.quote.open
                High: stock.quote.high,
                Low: stock.quote.low,
                'Last Price': stock.quote.lastPrice,
                Volume: stock.quote.volume.toLocaleString(),
                'Previous Close': stock.quote.previousClose,
                Change: stock.quote.change,
                'Change Percent': `${stock.quote.changePercent}%`,
                'Latest Trading Day': new Date(stock.quote.latestTradingDay).toLocaleDateString(),
                }).reduce((rows, entry, index) => {
                    const rowIndex = Math.floor(index / 3);
                    if (!rows[rowIndex]) rows[rowIndex] = [];
                    rows[rowIndex].push(entry);
                    return rows;
                  }, [] as [string, any][][]).map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.cardRowMulti}>
                      {row.map(([label, value]) => (
                        <View key={label} style={{ flex: 1 }}>
                          <Text style={styles.cardLabel}>{label}</Text>
                          <Text style={styles.cardValue}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  ))}

                
          </View>
          {position && (
                    <>
                <View style = {styles.positionCard}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Current Position</Text>

                    {Object.entries({
                        Quantity: position?.quantity, 
                        'Position Ratio': `${position?.positionRatio}%` , 
                        'Position Type': position?.type,
                        'Average Price Per Share ': `$${position?.averagePurchasePrice}`, 
                        Cost: `$${position?.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`, 
                        'Market Value': `$${position?.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`,

                    }).reduce((rows, entry, index) => {
                        const rowIndex = Math.floor(index / 3);
                        if (!rows[rowIndex]) rows[rowIndex] = [];
                        rows[rowIndex].push(entry);
                        return rows;
                    }, [] as [string, any][][]).map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.cardRowMulti}>
                        {row.map(([label, value]) => (
                            <View key={label} style={{ flex: 1 }}>
                            <Text style={styles.cardLabel}>{label}</Text>
                            <Text style={styles.cardValue}>{value}</Text>
                            </View>
                        ))}
                        </View>
                    ))}  


                </View>
                    </>
                )}

            <TouchableOpacity style={styles.tradeButton} onPress={() => setIsModalVisible(true)}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Trade</Text>
            </TouchableOpacity>

        </>
      )}

      {error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}

      {/* Trade Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Select Trade Type</Text>

            {orderTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.orderTypeOption,
                  selectedOrderType === type && styles.selectedOrderType,
                ]}
                onPress={() => setSelectedOrderType(type)}
              >
                <Text style={{ color: selectedOrderType === type ? '#fff' : '#000' }}>{type}</Text>
              </TouchableOpacity>
            ))}

            <TextInput
              placeholder="Quantity"
              keyboardType="numeric"
              style={styles.inputField}
              value={quantity}
              onChangeText={setQuantity}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <Pressable onPress={() => setIsModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: '#000' }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={executeTrade} style={styles.confirmBtn}>
                <Text style={{ color: 'white' }}>Execute</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default TradeScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: '#121212',
  },
  lookUpInterface: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
    minWidth: 600,
    alignSelf:'center'

  },
  inputField: {
     borderRadius: 12,
    // marginRight: 8,
    textAlign: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#555',
    padding: 12,
    color: '#FFF',
    minWidth: 100,
    alignSelf: 'center',

    backgroundColor: '#1E1E1E',
  },
  lookUpButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 10,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  positionCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  cardRowMulti: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 12,
    color: '#AAA',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  stockDescription: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  tradeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
  },
  orderTypeOption: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
  },
  selectedOrderType: {
    backgroundColor: '#4CAF50',
  },
  cancelBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  confirmBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});
// const styles = StyleSheet.create({
//   container: {
//     paddingTop: 100,
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#f5f5f5',
//   },
//   lookUpInterface: {
//     flexDirection: 'row',
//     alignContent: 'center',
//     alignSelf: 'center',
//   },
//   inputField: {
//     borderRadius: 15,
//     borderColor: '#000',
//     borderWidth: 1,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     marginRight: 8,
//     color: '#000',
//     backgroundColor: '#fff',
//     textAlign: 'center',
//     minWidth: 100,
//   },
//   lookUpButton: {
//     padding: 8,
//     backgroundColor: '#ddd',
//     borderRadius: 8,
//   },
//   stockCard: {
//     padding: 16,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     marginTop: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   cardRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   cardRowMulti: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 8,
//     paddingVertical: 8,
//   },
//   cardLabel: {
//     fontWeight: 'bold',
//     color: '#333',
//     fontSize: 13,
//   },
//   cardValue: {
//     color: '#555',
//     fontSize: 13,
//   },
//   stockDescription: {
//     marginTop: 16,
//     fontStyle: 'italic',
//     color: '#666',
//     fontSize: 12,
//   },
//   positionCard: {
    
//     padding: 16,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     marginTop: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 3,    
      
//   },
//   tradeButton: {
//     marginTop: 16,
//     padding: 12,
//     backgroundColor: '#2e7d32',
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     padding: 16,
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 10,
//   },
//   orderTypeOption: {
//     padding: 10,
//     marginVertical: 5,
//     borderRadius: 6,
//     backgroundColor: '#eee',
//   },
//   selectedOrderType: {
//     backgroundColor: '#2e7d32',
//   },
//   cancelBtn: {
//     padding: 10,
//     backgroundColor: '#eee',
//     borderRadius: 6,
//   },
//   confirmBtn: {
//     padding: 10,
//     backgroundColor: '#2e7d32',
//     borderRadius: 6,
//   },
// });
