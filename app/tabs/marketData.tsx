// MarketDataScreen.js
import {
    connectToMarketData,
    joinSymbolGroup,
    disconnect,
  } from '../../app/services/SignalRService';
  import React, { useEffect, useState } from 'react';
  import {
    View,
    Text,
    Platform,
    StyleSheet,
  } from 'react-native';
  import * as SecureStore from 'expo-secure-store';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import axios from 'axios';
  
  interface TradeUpdate {
    Symbol: string;
    Price: number;
    Size: number;
    Timestamp: string;
  }
  
  interface QuoteUpdate {
    Symbol: string;
    AskPrice: number;
    BidPrice: number;
    AskSize: number;
    BidSize: number;
    Timestamp: string;
  }
  
  interface BarUpdate {
    Symbol: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
    Timestamp: string;
  }
  
  let token: string | null = null;
  let userId: string | null = null;
  
  export default function MarketDataScreen() {
    const [trade, setTrade] = useState<TradeUpdate | null>(null);
    const [quote, setQuote] = useState<QuoteUpdate | null>(null);
    const [bar, setBar] = useState<BarUpdate | null>(null);
  
    // Parse raw messages from SignalR
    const parseTrade = (raw: any): TradeUpdate => ({
      Symbol: raw.S,
      Price: raw.p,
      Size: raw.s,
      Timestamp: raw.t,
    });
  
    const parseQuote = (raw: any): QuoteUpdate => ({
      Symbol: raw.S,
      AskPrice: raw.ap,
      BidPrice: raw.bp,
      AskSize: raw.as,
      BidSize: raw.bs,
      Timestamp: raw.t,
    });
  
    const parseBar = (raw: any): BarUpdate => ({
      Symbol: raw.S,
      Open: raw.o,
      High: raw.h,
      Low: raw.l,
      Close: raw.c,
      Volume: raw.v,
      Timestamp: raw.t,
    });
  
    useEffect(() => {
      const subscribe = async () => {
        const symbol = 'AAPL';
        if (Platform.OS === 'web') {
          token = await AsyncStorage.getItem('userToken');
          userId = await AsyncStorage.getItem('userId');
        } else {
          token = await SecureStore.getItemAsync('userToken');
          userId = await SecureStore.getItemAsync('userId');
        }
  
        await axios.post(
          `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/alpaca/subscribe/all/${symbol}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      };
  
      const setup = async () => {
        await connectToMarketData(
          (rawTrade: any) => setTrade(parseTrade(rawTrade)),
          (rawQuote: any) => setQuote(parseQuote(rawQuote)),
          (rawBar: any) => setBar(parseBar(rawBar))
        );
  
        await joinSymbolGroup('AAPL');
      };
  
      subscribe();
      setup();
  
      return () => {
        disconnect();
      };
    }, []);
  
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Market Data</Text>
  
        <View style={styles.section}>
          <Text style={styles.label}>Latest Trade:</Text>
          {trade ? (
            <>
              <Text style={styles.value}>Symbol: {trade.Symbol}</Text>
              <Text style={styles.value}>Price: {trade.Price}</Text>
              <Text style={styles.value}>Size: {trade.Size}</Text>
              <Text style={styles.value}>Time: {new Date(trade.Timestamp).toLocaleTimeString()}</Text>
            </>
          ) : (
            <Text style={styles.value}>N/A</Text>
          )}
        </View>
  
        <View style={styles.section}>
          <Text style={styles.label}>Latest Quote:</Text>
          {quote ? (
            <>
              <Text style={styles.value}>Symbol: {quote.Symbol}</Text>
              <Text style={styles.value}>Bid: {quote.BidPrice} x {quote.BidSize}</Text>
              <Text style={styles.value}>Ask: {quote.AskPrice} x {quote.AskSize}</Text>
              <Text style={styles.value}>Time: {new Date(quote.Timestamp).toLocaleTimeString()}</Text>
            </>
          ) : (
            <Text style={styles.value}>N/A</Text>
          )}
        </View>
  
        <View style={styles.section}>
          <Text style={styles.label}>Latest Bar:</Text>
          {bar ? (
            <>
              <Text style={styles.value}>Symbol: {bar.Symbol}</Text>
              <Text style={styles.value}>O/H/L/C: {bar.Open} / {bar.High} / {bar.Low} / {bar.Close}</Text>
              <Text style={styles.value}>Volume: {bar.Volume}</Text>
              <Text style={styles.value}>Time: {new Date(bar.Timestamp).toLocaleTimeString()}</Text>
            </>
          ) : (
            <Text style={styles.value}>N/A</Text>
          )}
        </View>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: '#121212',
      flex: 1,
    },
    heading: {
      color: '#FFD700',
      fontSize: 24,
      marginBottom: 16,
    },
    section: {
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
      paddingBottom: 8,
    },
    label: {
      color: '#AAA',
      fontSize: 16,
      marginBottom: 4,
    },
    value: {
      color: '#FFF',
      fontSize: 14,
    },
  });
  

// // MarketDataScreen.js
// import { connectToMarketData, joinSymbolGroup, disconnect } from '../../app/services/SignalRService';
// import React, { useEffect, useState } from 'react';
// import { View, Text, Button, StyleSheet } from 'react-native';
// import { useRouter } from 'expo-router';
// import * as SecureStore from 'expo-secure-store';
// import { Platform } from 'react-native';
// import AsyncStorage  from '@react-native-async-storage/async-storage';
// import axios, { Axios } from 'axios';
// import { Alert, TextInput, Modal } from 'react-native';
// import Toast from 'react-native-toast-message';
// interface TradeUpdate {
//     Symbol: string;
//     Price: number;
//     Size: number;
//     Timestamp: string;
//   }
  
//   interface QuoteUpdate {
//     Symbol: string;
//     AskPrice: number;
//     BidPrice: number;
//     AskSize: number;
//     BidSize: number;
//     Timestamp: string;
//   }
  
//   interface BarUpdate {
//     Symbol: string;
//     Open: number;
//     High: number;
//     Low: number;
//     Close: number;
//     Volume: number;
//     Timestamp: string;
//   }
//   let token : string|null = null;
//   let userId: string|null= null; 
// export default function MarketDataScreen() {
//     const [trade, setTrade] = useState<TradeUpdate | null>(null);
//     const [quote, setQuote] = useState<QuoteUpdate | null>(null);
//     const [bar, setBar] = useState<BarUpdate | null>(null);
  
//     useEffect(() => {
//         const subscribe = async ()=>{
//             const symbol = "AAPL"
//             if(Platform.OS == 'web'){
//                 token = await AsyncStorage.getItem('userToken');
//                 userId = await AsyncStorage.getItem('userId');
//               }
//               else{
//                 token = await SecureStore.getItemAsync('userToken');
//                 userId = await SecureStore.getItemAsync('userId');
//               }

//               const response = await axios.post(`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/alpaca/subscribe/${symbol}`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 }
//             })
//                 console.log(response.data)

//         }

//         const setup = async () => {
//           await connectToMarketData(
//             (tradeData:TradeUpdate) => setTrade(tradeData),
//             (quoteData:QuoteUpdate) => setQuote(quoteData),
//             (barData:BarUpdate) => setBar(barData)
//           );
      
//           await joinSymbolGroup('AAPL');
//         };
//         subscribe();
//         setup();
      
//         return () => {
//           // call disconnect, but don't `await` it
//           disconnect();
//         };
//       }, []);
//       return (
//         <View>
        
//           <Text>Latest Trade: {JSON.stringify(trade)}</Text>
//           <Text>Latest Quote: {JSON.stringify(quote)}</Text>
//           <Text>Latest Bar: {JSON.stringify(bar)}</Text>
//         </View>
//       );
//     }
