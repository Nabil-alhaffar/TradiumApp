import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage  from '@react-native-async-storage/async-storage';
import axios, { Axios } from 'axios';
import { Alert, TextInput, Modal } from 'react-native';


interface userInfo{
    userId: string ;
    token: string;
    email: string;
    username: string; 
    firstName: string;
    lastName: string;
}
const AccountScreen = () => {
  const router = useRouter();
  const [userData, setUserData]= useState <userInfo|null> (null);
  let token : string|null = null;
  let userId: string|null= null; 
  useEffect (()=> {
    const fetchAccountData = async () => {


        if(Platform.OS == 'web'){
            token = await AsyncStorage.getItem('userToken');
            userId = await AsyncStorage.getItem('userId');
          }
          else{
            token = await SecureStore.getItemAsync('userToken');
            userId = await SecureStore.getItemAsync('userId');
          }
          const response = await axios.get(`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/user/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })
            console.log(response.data)

          if (token && userId) {
            setUserData({ userId, token, email: response.data.email, username: response.data.userName,
                 firstName: response.data.firstName, lastName: response.data.lastName });
          }
        };
      fetchAccountData();
  },[])
 


  const handleLogout = async () => {

    if(Platform.OS== 'web')
    {
        
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userId');

    }
    else {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userId');
    }

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
  
      const response = await axios.patch(
        `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/user/${userData?.userId}/reset-password`,
        { newPassword },
        {
          headers: {
            Authorization: `Bearer ${userData?.token}`,
          },
        }
      );
  
      Alert.alert("Success", "Password reset successfully.");
      setIsModalVisible(false);
      setNewPassword('');
    } catch (error: any) {
      console.log(error.response?.data || error.message);
      Alert.alert("Error", "Failed to reset password.");
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
      </View>
  
      <View style={styles.tokenContainer}>
        <Text style={styles.label}>Access Token</Text>
        <Text style={styles.token}>{userData?.token}</Text>
      </View>
      <View style = {styles.buttonContainer}>
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
        flexDirection: 'row',
        padding:10,
        justifyContent : 'space-evenly'
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
  
