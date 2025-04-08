import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
        password: password
      });

      if (response.data.token) {
        if (Platform.OS== 'web')
        {
            await AsyncStorage.setItem('userToken', response.data.token)
            await AsyncStorage.setItem('userId', response.data.userId);

        }
        else{
            await SecureStore.setItemAsync('userToken', response.data.token);
            await SecureStore.setItemAsync('userId', response.data.userId);
        }

        console.log('Login successful!');
        router.replace('/'); 
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
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  title: { fontSize: 24, color: '#fff', marginBottom: 20 },
  input: { width: '80%', height: 40, backgroundColor: '#fff', marginBottom: 10, paddingHorizontal: 10 },
  button: { backgroundColor: '#008000', padding: 10, width: '80%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18 },
  errorText: { color: 'red', marginBottom: 10 },
});
