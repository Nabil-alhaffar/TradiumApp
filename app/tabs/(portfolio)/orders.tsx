import axios from 'axios';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment'
import AsyncStorage from '@react-native-async-storage/async-storage';
interface order{
  orderId: string
  userId: string,
  symbol: string,
  quantity: number,
  price: number,
  type: string,
  timestamp: Date
}
let token: string | null = null;
let userId : string| null = null; 
export default function OrdersScreen() {
  const [orders, setOrders]= useState < order[]> ([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  useEffect (()=> {
    const fetchOrders = async ()=> {
      
      if(Platform.OS == 'web'){
        token = await AsyncStorage.getItem('userToken');
        userId = await AsyncStorage.getItem('userId');
      }
      else{
        token = await SecureStore.getItem('userToken');
        userId = await SecureStore.getItem('userId');
      }
      try{
      
        const response = await axios.get (`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/order/${userId}`, {
          headers : {
            Authorization: `Bearer ${token} `
          }
        });
        console.log("fetched orders:", response.data);
        setOrders(response.data.orders);
      } catch (error: any) {
        setError(error.message);
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  },[])
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#808080" />
        <Text>Loading orders...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load orders: {error}</Text>
      </View>
    );
  }
  if (!orders || orders.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No orders available</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Orders History</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.orderId}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                borderLeftColor:
                  item.type.toLowerCase() === 'buy' ? '#4CAF50' : '#F44336',
              },
            ]}
          >
            <View style={styles.row}>
              <MaterialIcons
                name={
                  item.type.toLowerCase() === 'buy'
                    ? 'trending-up'
                    : 'trending-down'
                }
                size={24}
                color={item.type.toLowerCase() === 'buy' ? '#4CAF50' : '#F44336'}
              />
              <Text style={styles.symbol}>{item.symbol.toUpperCase()}</Text>
              <Text style={styles.type}>
                {item.type.toUpperCase()} x {item.quantity}
              </Text>
            </View>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            <Text style={styles.date}>
              {moment(item.timestamp).format('MMM DD, YYYY h:mm A')}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: '#121212',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
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
    fontWeight: 'bold',
    color: '#FFF',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 16,
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
});