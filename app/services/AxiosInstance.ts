import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const axiosInstance = axios.create({
  baseURL: 'https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api',
  withCredentials: true, // Required for sending cookies
  paramsSerializer: (params) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else {
        query.append(key, value as string);
      }
    });

    return query.toString();
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = Platform.OS === 'web'
        ? await AsyncStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;
  
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
  
        try {
        const expiredToken = Platform.OS === 'web'
            ? await AsyncStorage.getItem('userToken')
            : await SecureStore.getItemAsync('userToken');

          if (!expiredToken) throw new Error('No expired token found');
  
          const refreshResponse = await axiosInstance.post(
            '/auth/refresh-token',
            {}, // empty body
            {
              headers: {
                Authorization: `Bearer ${expiredToken}`
              }
            }
          );
  
          const newToken = refreshResponse.data.token;
          if (!newToken) throw new Error('No new token returned');
          
          Platform.OS === 'web'
          ? await AsyncStorage.setItem('userToken', newToken)
          : await SecureStore.setItemAsync('userToken', newToken);
        //   await SecureStore.setItemAsync('userToken', newToken);
          
          // Update the original request’s Authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error('Refresh failed:', refreshError);
          return Promise.reject(refreshError);
        }
      }
  
      return Promise.reject(error);
    }
  );

export default axiosInstance;