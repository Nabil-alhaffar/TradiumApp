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

import axiosInstance from './services/AxiosInstance';
const LoginScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/auth/login', {
        username: username,
        password: password,
        timeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      if (response.data.token) {
        if (Platform.OS === 'web') {
          await AsyncStorage.setItem('userToken', response.data.token);
          await AsyncStorage.setItem('userId', response.data.userId);
          await AsyncStorage.setItem('sessionId', response.data.sessionId)
        } else {
          await SecureStore.setItemAsync('userToken', response.data.token);
          await SecureStore.setItemAsync('userId', response.data.userId);
          await SecureStore.setItemAsync('sessionId', response.data.sessionId);

        }

        // Check KYC status after successful login
        try {
          const profileResponse = await axiosInstance.get('/user/profile');
          const kycStatus = profileResponse.data.kycStatus;
          
          Toast.show({
            type: 'success',
            text1: 'Login successful!',
            text2: `Welcome back, ${response.data.firstName}!`,
          });

          // Check if KYC is completed
          if (kycStatus !== 'Verified') {
            // Show KYC prompt
            Toast.show({
              type: 'info',
              text1: 'KYC Required',
              text2: kycStatus === 'PendingReview' 
                ? 'Your KYC is under review. You can view your account but trading is restricted.'
                : 'Please complete KYC verification to start trading.',
              visibilityTime: 5000,
            });
            
            // Navigate to account page to show KYC status
            router.replace('/tabs/account');
          } else {
            // KYC is verified, go to portfolio
            router.replace('/tabs/(portfolio)/summary');
          }
        } catch (profileError) {
          console.error('Failed to fetch profile:', profileError);
          // If profile fetch fails, still allow login but go to account page
          Toast.show({
            type: 'success',
            text1: 'Login successful!',
            text2: `Welcome back, ${response.data.firstName}!`,
          });
          router.replace('/tabs/account');
        }
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
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
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

      <TouchableOpacity 
        style={styles.signupLink}
        onPress={() => router.push('/signup')}
      >
        <Text style={styles.signupLinkText}>
          Don't have an account? <Text style={styles.signupLinkBold}>Sign Up</Text>
        </Text>
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
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupLinkText: {
    color: '#888',
    fontSize: 14,
  },
  signupLinkBold: {
    color: '#2E8B57',
    fontWeight: '600',
  },
});
