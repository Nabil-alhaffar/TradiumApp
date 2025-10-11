import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage  from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert, TextInput, Modal } from 'react-native';
import Toast from 'react-native-toast-message';
import { disconnect }  from '../services/SignalRService';
import axiosInstance from '../services/AxiosInstance';
interface userInfo{
    userId: string ;
    token: string;
    email: string;
    sessionId:string
    username: string; 
    firstName: string;
    lastName: string;
}
const AccountScreen = () => {
  const router = useRouter();
  const [userData, setUserData]= useState <userInfo|null> (null);
  let token : string|null = null;
  let userId: string|null= null; 
  let sessionId: string|null= null;

  useEffect (()=> {
    const fetchAccountData = async () => {


        if(Platform.OS == 'web'){
            token = await AsyncStorage.getItem('userToken');
            userId = await AsyncStorage.getItem('userId');
            sessionId = await AsyncStorage.getItem ('sessionId');
          }
          else{
            token = await SecureStore.getItemAsync('userToken');
            userId = await SecureStore.getItemAsync('userId');
            sessionId = await SecureStore.getItemAsync('sessionId');

          }
          try{
            const response = await axiosInstance.get(`/user/profile`);
            console.log('profile response:', response.data);

            if (token && userId && sessionId) {
              setUserData({ userId, token, email: response.data.email,sessionId: sessionId, username: response.data.userName,
                   firstName: response.data.firstName, lastName: response.data.lastName });
            }
          } catch (err: any) {
            const status = err?.response?.status;
            const body = err?.response?.data;
            console.log('Profile fetch error:', body || err?.message);

            // Fallback: if backend routes profile to {userId} and returns validation error, try old endpoint
            const looksLikeUserIdValidation = status === 400 && body && (body.errors?.userId || body.title?.includes("userId"));
            if (looksLikeUserIdValidation && userId) {
              try {
                const legacy = await axiosInstance.get(`/user/${userId}`);
                console.log('legacy user response:', legacy.data);
                if (token && sessionId) {
                  setUserData({ userId, token, email: legacy.data.email, sessionId, username: legacy.data.userName,
                    firstName: legacy.data.firstName, lastName: legacy.data.lastName });
                }
                return; // success via fallback
              } catch (legacyErr: any) {
                console.log('Legacy fetch error:', legacyErr?.response?.data || legacyErr?.message);
              }
            }

            Toast.show({
              type: 'error',
              text1: 'Failed to load profile',
              text2: typeof body === 'string' ? body : JSON.stringify(body || err?.message || 'Unknown error'),
            });
          }
        };
      fetchAccountData();
  },[])
 


  const handleLogout = async () => {

    const response = await axiosInstance.post('/auth/logout', {
      sessionId: userData?.sessionId} ,
      {
        headers: {
          Authorization: `Bearer ${userData?.token}`,
        },
      });

    if(Platform.OS== 'web')
    {
        
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userId');
        await AsyncStorage.removeItem('sessionId');

    }
    else {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userId');
        await SecureStore.deleteItemAsync('sessionId');
    }
    disconnect(); //SignalR Disconnector 
    
    Toast.show({
      type: 'success',
      text1: `Logout successful! `,
    });
    router.replace('/login'); 
  };


  const [newPassword, setNewPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const handleResetPassword = async () => {
    try {
      if (!newPassword.trim()) {
        Alert.alert("Error", "Password cannot be empty.");
        return;
      }
  
      const response = await axiosInstance.patch(
        `/user/${userData?.userId}/reset-password`,
        { newPassword },
      );
      Toast.show({
        type: 'success',
        text1: `Password reset successfully.`,
        text2: `${response.data.Message}`,
      });
      Alert.alert("Success", "Password reset successfully.");
      setIsModalVisible(false);
      setNewPassword('');
    } catch (error: any) {
      console.log(error.response?.data || error.message);
      Toast.show({
        type: 'Error',
        text1: `Failed to reset password.`,
        text2: `${error}`,
      });
      Alert.alert("Error", "");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
  
      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <Text style={styles.value}>{userData?.firstName} {userData?.lastName}</Text>
  
        <Text style={styles.label}>Username</Text>
        <Text style={styles.value}>{userData?.username}</Text>
  
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{userData?.email}</Text>
  
        <Text style={styles.label}>User ID</Text>
        <Text style={styles.value}>{userData?.userId}</Text>
          
        <Text style={styles.label}>Session ID</Text>
        <Text style={styles.value}>{userData?.sessionId}</Text>
      </View>
  
      <View style={styles.tokenContainer}>
        <Text style={styles.label}>Access Token</Text>
        <Text style={styles.token}>{userData?.token}</Text>
      </View>
      <View style = {styles.buttonContainer}>
      <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/kyc')}>
        <MaterialIcons name="verified-user" size={20} color="#2E8B57" />
        <Text style={styles.actionButtonText}>Complete KYC</Text>
      </TouchableOpacity>
      <Button color={"#121212"}  title="Logout" onPress={handleLogout} />
      <Button color={"121212"}  title="Reset Password" onPress={() => setIsModalVisible(true)} />

        <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
                secureTextEntry
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#aaa"
            />
            <Button title="Submit" onPress={handleResetPassword} />
            <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
            </View>
        </View>
        </Modal>
        </View>
    </View>
  );
  
};

export default AccountScreen;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      backgroundColor: '#121212',
      justifyContent: 'flex-start',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFD700',
      marginBottom: 24,
      alignSelf: 'center',
    },
    card: {
      backgroundColor: '#1e1e1e',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
    },
    label: {
      fontSize: 14,
      color: '#aaa',
      marginTop: 12,
    },
    value: {
      fontSize: 18,
      color: '#fff',
      fontWeight: '500',
    },
    tokenContainer: {
      backgroundColor: '#1e1e1e',
      padding: 12,
      borderRadius: 10,
      marginBottom: 20,
    },
    token: {
      fontSize: 12,
      color: '#ccc',
      marginTop: 4,
    },
    buttonContainer:{
        flexDirection: 'column',
        padding:10,
        gap: 10,
    },
    actionButton: {
        backgroundColor: '#1F1F1F',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#2E8B57',
        borderWidth: 1,
        marginBottom: 10,
    },
    actionButtonText: {
        color: '#2E8B57',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
      },
      modalContent: {
        backgroundColor: '#1e1e1e',
        padding: 20,
        borderRadius: 10,
        width: '80%',
      },
      input: {
        backgroundColor: '#2a2a2a',
        color: '#fff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
      },
  });
  
