import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/auth/login', {
        username: email,
        password: password,
      });

      if (response.data.token) {
        if (Platform.OS === 'web') {
          await AsyncStorage.setItem('userToken', response.data.token);
          await AsyncStorage.setItem('userId', response.data.userId);
        } else {
          await SecureStore.setItemAsync('userToken', response.data.token);
          await SecureStore.setItemAsync('userId', response.data.userId);
        }

        Toast.show({
          type: 'success',
          text1: 'Login successful!',
          text2: `Welcome back, ${response.data.userId}!`,
        });

        router.replace('/tabs/(portfolio)/summary');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/tradium-logo.png')} //
        style={styles.logo}
        resizeMode="contain"
      />
      {/* <Text style={styles.title}>Welcome to Tradium</Text> */}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 400,
    height: 400,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: 30,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#1F1F1F',
    color: '#FFF',
    marginBottom: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    borderColor: '#2E8B57',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#2E8B57',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF5A5F',
    marginBottom: 10,
    fontSize: 14,
  },
});

// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
// import { useRouter } from 'expo-router';
// import * as SecureStore from 'expo-secure-store';
// import axios from 'axios';
// import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Toast from 'react-native-toast-message';


// const LoginScreen = () => {
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleLogin = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await axios.post('https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/auth/login', {
//         username: email,
//         password: password
//       });

//       if (response.data.token) {
//         if (Platform.OS== 'web')
//         {
//             await AsyncStorage.setItem('userToken', response.data.token)
//             await AsyncStorage.setItem('userId', response.data.userId);

//         }
//         else{
//             await SecureStore.setItemAsync('userToken', response.data.token);
//             await SecureStore.setItemAsync('userId', response.data.userId);
//         }
//         Toast.show({
//           type: 'success',
//           text1: `Login successful! `,
//           text2: `Welcome back, ${response.data.userId}!`,
//         });
//         console.log('Login successful!');
//         router.replace('/tabs/(portfolio)/summary');     
//         // router.replace('/tabs'); 


//       }
//     } catch (error) {
//       console.error('Login failed:', error);
//       setError('Invalid email or password');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Login</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         value={email}
//         onChangeText={setEmail}
//       />

//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         secureTextEntry
//         value={password}
//         onChangeText={setPassword}
//       />

//       {error && <Text style={styles.errorText}>{error}</Text>}

//       <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
//         {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default LoginScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
//   title: { fontSize: 24, color: '#fff', marginBottom: 20 },
//   input: { width: '80%', height: 40, backgroundColor: '#fff', marginBottom: 10, paddingHorizontal: 10 },
//   button: { backgroundColor: '#008000', padding: 10, width: '80%', alignItems: 'center' },
//   buttonText: { color: '#fff', fontSize: 18 },
//   errorText: { color: 'red', marginBottom: 10 },
// });
