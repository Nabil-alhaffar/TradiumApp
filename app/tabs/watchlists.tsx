import { ThemedText } from '@/components/ThemedText';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface Watchlist {
  symbols: string[];
  name: string;
}

let token: string | null = null;
let userId: string | null = null;

const WatchlistScreen = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchWatchlists = async () => {
      try {
        if (Platform.OS === 'web') {
          token = await AsyncStorage.getItem('userToken');
          userId = await AsyncStorage.getItem('userId');
        } else {
          token = await SecureStore.getItemAsync('userToken');
          userId = await SecureStore.getItemAsync('userId');
        }
        
        const response = await axios.get(
          `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/watchlists/${userId}`,
        );

        console.log('Fetched watchlists:', response.data);
        setWatchlists(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.log("Axios error:", error.toJSON());
        }
        console.error('Error fetching watchlists', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlists();
  }, []);

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
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No watchlists available</Text>
      </View>
    );
  }

  const currentWatchlist = watchlists[currentIndex];

  return (
    <View style={styles.container}>
      {/* Navigation Buttons */}
      <View style={styles.navContainer}>
        <TouchableOpacity
          onPress={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentIndex === 0}
          style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
        >
          <Text style={styles.navText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{currentWatchlist.name}</Text>
        <TouchableOpacity
          onPress={() => setCurrentIndex((prev) => Math.min(prev + 1, watchlists.length - 1))}
          disabled={currentIndex === watchlists.length - 1}
          style={[styles.navButton, currentIndex === watchlists.length - 1 && styles.disabledButton]}
        >
          <Text style={styles.navText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Watchlist Symbols */}
      <ScrollView style={styles.symbolList}>
        {currentWatchlist.symbols.map((symbol, index) => (
          <View key={index} style={styles.symbolItem}>
            <Text style={styles.symbolText}>{symbol}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default WatchlistScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#ccc', fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ff4d4d', fontSize: 16 },
  navContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navButton: {
    padding: 10,
    backgroundColor: '#1e90ff',
    borderRadius: 8,
  },
  disabledButton: { backgroundColor: '#555' },
  navText: { fontSize: 20, color: '#fff' },
  symbolList: { marginTop: 10 },
  symbolItem: {
    padding: 12,
    backgroundColor: '#1e1e1e',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  symbolText: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
});

// import { ThemedText } from '@/components/ThemedText';
// import axios from 'axios';
// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
// import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as SecureStore from 'expo-secure-store';

// interface Watchlist {
//   symbols: string[];
//   name: string;
// }
// let token: string | null = null;
// let userId : string| null = null; 

// const WatchlistScreen = () => {
//   const [watchlists, setWatchlists] = useState<Watchlist[] | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   useEffect(() => {
//     const fetchWatchlists = async () => {
//       try {

//         if (Platform.OS === 'web') {
//           token = await AsyncStorage.getItem('userToken');
//           userId = await AsyncStorage.getItem('userId');
//          }
//       else {
//           token = await SecureStore.getItemAsync('userToken');
//           userId = await SecureStore.getItemAsync('userId');
//          }
//         const response = await axios.get(
//           `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/watchlists/${userId}`,
//           // { headers: { Accept: 'application/json' }, validateStatus: () => true }
//         );

//         console.log('Fetched watchlists:', response.data);
//         setWatchlists(response.data); // Corrected data assignment
//       } catch (error) {
//         if (axios.isAxiosError(error)) {
//           console.log("Axios error:", error.toJSON());  // Shows detailed error info
//       }         console.error('Error fetching watchlists', error);
//          setError(error instanceof Error ? error.message : 'Unknown error');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchWatchlists();
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.loader}>
//         <ActivityIndicator size="large" color="#808080" />
//         <Text>Loading watchlists...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>Failed to load watchlists: {error}</Text>
//       </View>
//     );
//   }

//   if (!watchlists || watchlists.length === 0) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>No watchlists available</Text>
//       </View>
//     );
//   }

//   const currentWatchlist = watchlists[currentIndex];

//   return (
//     <View style={styles.container}>
//       {/* Navigation Buttons */}
//       <View style={styles.navContainer}>
//         <TouchableOpacity
//           onPress={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
//           disabled={currentIndex === 0}
//           style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
//         >
//           <Text style={styles.navText}>◀</Text>
//         </TouchableOpacity>
//         <Text style={styles.title}>{currentWatchlist.name}</Text>
//         <TouchableOpacity
//           onPress={() => setCurrentIndex((prev) => Math.min(prev + 1, watchlists.length - 1))}
//           disabled={currentIndex === watchlists.length - 1}
//           style={[styles.navButton, currentIndex === watchlists.length - 1 && styles.disabledButton]}
//         >
//           <Text style={styles.navText}>▶</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Watchlist Symbols */}
//       <ScrollView style={styles.symbolList}>
//         {currentWatchlist.symbols.map((symbol, index) => (
//           <View key={index} style={styles.symbolItem}>
//             <Text style={styles.symbolText}>{symbol}</Text>
//           </View>
//         ))}
//       </ScrollView>
//     </View>
//   );
// };

// export default WatchlistScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#f5f5f5',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     color: '#333',
//     textAlign: 'center',
//   },
//   loader: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorText: {
//     color: 'red',
//     fontSize: 16,
//   },
//   navContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   navButton: {
//     padding: 10,
//     backgroundColor: '#007bff',
//     borderRadius: 5,
//   },
//   disabledButton: {
//     backgroundColor: '#d3d3d3',
//   },
//   navText: {
//     fontSize: 20,
//     color: 'white',
//   },
//   symbolList: {
//     marginTop: 10,
//   },
//   symbolItem: {
//     padding: 10,
//     backgroundColor: '#fff',
//     marginBottom: 8,
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   symbolText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#007bff',
//   },
// });
