import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage  from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert, Modal } from 'react-native';
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
    kycStatus?: string;
    amlStatus?: string;
    tradingPermissions?: string[];
    marginApprovalStatus?: string;
    optionsApprovalStatus?: string;
    cryptoApprovalStatus?: string;
}

interface TradingPermissionsRequest {
  // Margin Trading
  enableMarginTrading: boolean;
  marginTradingRiskUnderstanding?: string;
  marginTradingExperience?: string;
  requestedMaxLeverage?: number;

  // Options Trading
  enableOptionsTrading: boolean;
  optionsTradingRiskUnderstanding?: string;
  optionsTradingExperience?: string;
  requestedOptionsLevel?: string;

  // Cryptocurrency Trading
  enableCryptoTrading: boolean;
  cryptoTradingRiskUnderstanding?: string;
  cryptoTradingExperience?: string;

  // Other Trading Permissions
  enableShortSelling: boolean;
  enablePennyStockTrading: boolean;
  enableAfterHoursTrading: boolean;
  enablePreMarketTrading: boolean;
  enableInternationalTrading: boolean;
  enableLeveragedETFTrading: boolean;
  enableInverseETFTrading: boolean;

  // Trading Limits
  requestedMaxPositionSize?: number;
  requestedDailyTradingLimit?: number;
  requestedMaxOrderSize?: number;

  // Risk Management (Required)
  tradingRiskUnderstanding: string;
  tradingStrategy?: string;
  riskManagementApproach?: string;
  usesStopLoss: boolean;
  usesTakeProfit: boolean;

  // Financial Information (Required)
  liquidAssetsForTrading: number;
  totalInvestmentPortfolioValue: number;
  percentageOfPortfolioForTrading: number;
  emergencyFundAmount: number;

  // Compliance (Required)
  understandsRisks: boolean;
  canAffordToLose: boolean;
  hasReadRiskDisclosure: boolean;
  agreesToTerms: boolean;
  additionalComments?: string;
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
              setUserData({ 
                userId, 
                token, 
                email: response.data.email,
                sessionId: sessionId, 
                username: response.data.userName,
                firstName: response.data.firstName, 
                lastName: response.data.lastName,
                kycStatus: response.data.kycStatus,
                amlStatus: response.data.amlStatus,
                tradingPermissions: response.data.tradingPermissions,
                marginApprovalStatus: response.data.marginApprovalStatus,
                optionsApprovalStatus: response.data.optionsApprovalStatus,
                cryptoApprovalStatus: response.data.cryptoApprovalStatus
              });
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
                  setUserData({ 
                    userId, 
                    token, 
                    email: legacy.data.email, 
                    sessionId, 
                    username: legacy.data.userName,
                    firstName: legacy.data.firstName, 
                    lastName: legacy.data.lastName,
                    kycStatus: legacy.data.kycStatus,
                    amlStatus: legacy.data.amlStatus,
                    tradingPermissions: legacy.data.tradingPermissions,
                    marginApprovalStatus: legacy.data.marginApprovalStatus,
                    optionsApprovalStatus: legacy.data.optionsApprovalStatus,
                    cryptoApprovalStatus: legacy.data.cryptoApprovalStatus
                  });
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
  const [isTradingPermissionsModalVisible, setIsTradingPermissionsModalVisible] = useState(false);
  const [tradingPermissions, setTradingPermissions] = useState<TradingPermissionsRequest>({
    // Margin Trading
    enableMarginTrading: false,
    marginTradingRiskUnderstanding: '',
    marginTradingExperience: '',
    requestedMaxLeverage: 0,

    // Options Trading
    enableOptionsTrading: false,
    optionsTradingRiskUnderstanding: '',
    optionsTradingExperience: '',
    requestedOptionsLevel: 'Level1',

    // Cryptocurrency Trading
    enableCryptoTrading: false,
    cryptoTradingRiskUnderstanding: '',
    cryptoTradingExperience: '',

    // Other Trading Permissions
    enableShortSelling: false,
    enablePennyStockTrading: false,
    enableAfterHoursTrading: false,
    enablePreMarketTrading: false,
    enableInternationalTrading: false,
    enableLeveragedETFTrading: false,
    enableInverseETFTrading: false,

    // Trading Limits
    requestedMaxPositionSize: 0,
    requestedDailyTradingLimit: 0,
    requestedMaxOrderSize: 0,

    // Risk Management (Required)
    tradingRiskUnderstanding: '',
    tradingStrategy: '',
    riskManagementApproach: '',
    usesStopLoss: false,
    usesTakeProfit: false,

    // Financial Information (Required)
    liquidAssetsForTrading: 0,
    totalInvestmentPortfolioValue: 0,
    percentageOfPortfolioForTrading: 0,
    emergencyFundAmount: 0,

    // Compliance (Required)
    understandsRisks: false,
    canAffordToLose: false,
    hasReadRiskDisclosure: false,
    agreesToTerms: false,
    additionalComments: '',
  });
  const [tradingPermissionsLoading, setTradingPermissionsLoading] = useState(false);
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

  const handleTradingPermissionsSubmit = async () => {
    setTradingPermissionsLoading(true);
    try {
      const response = await axiosInstance.post('/user/trading-permissions', tradingPermissions);
      
      Toast.show({
        type: 'success',
        text1: 'Trading Permissions Requested',
        text2: 'Your request is under review. You will be notified once approved.',
      });
      
      setIsTradingPermissionsModalVisible(false);
      
      // Refresh user data to show updated status
      const profileResponse = await axiosInstance.get('/user/profile');
      setUserData(prev => prev ? {
        ...prev,
        tradingPermissions: profileResponse.data.tradingPermissions,
        marginApprovalStatus: profileResponse.data.marginApprovalStatus,
        optionsApprovalStatus: profileResponse.data.optionsApprovalStatus,
        cryptoApprovalStatus: profileResponse.data.cryptoApprovalStatus
      } : null);
      
    } catch (error: any) {
      console.error('Trading permissions request failed:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit trading permissions request.';
      Alert.alert("Error", errorMessage);
    } finally {
      setTradingPermissionsLoading(false);
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

        <Text style={styles.label}>KYC Status</Text>
        <Text style={[styles.value, { 
          color: userData?.kycStatus === 'Verified' ? '#4CAF50' : 
                 userData?.kycStatus === 'Pending' ? '#FF9800' : 
                 userData?.kycStatus === 'Rejected' ? '#F44336' : '#FFD700'
        }]}>
          {userData?.kycStatus || 'Not Started'}
        </Text>

        <Text style={styles.label}>AML Status</Text>
        <Text style={[styles.value, { 
          color: userData?.amlStatus === 'Cleared' ? '#4CAF50' : 
                 userData?.amlStatus === 'Pending' ? '#FF9800' : 
                 userData?.amlStatus === 'Failed' ? '#F44336' : '#FFD700'
        }]}>
          {userData?.amlStatus || 'Not Started'}
        </Text>

        <Text style={styles.label}>Trading Permissions</Text>
        <Text style={[styles.value, { color: '#4CAF50' }]}>
          {userData?.tradingPermissions?.length ? userData.tradingPermissions.join(', ') : 'Basic (Stocks Only)'}
        </Text>

        <Text style={styles.label}>Margin Approval</Text>
        <Text style={[styles.value, { 
          color: userData?.marginApprovalStatus === 'Approved' ? '#4CAF50' : 
                 userData?.marginApprovalStatus === 'Pending' ? '#FF9800' : 
                 userData?.marginApprovalStatus === 'Rejected' ? '#F44336' : '#FFD700'
        }]}>
          {userData?.marginApprovalStatus || 'Not Requested'}
        </Text>

        <Text style={styles.label}>Options Approval</Text>
        <Text style={[styles.value, { 
          color: userData?.optionsApprovalStatus === 'Approved' ? '#4CAF50' : 
                 userData?.optionsApprovalStatus === 'Pending' ? '#FF9800' : 
                 userData?.optionsApprovalStatus === 'Rejected' ? '#F44336' : '#FFD700'
        }]}>
          {userData?.optionsApprovalStatus || 'Not Requested'}
        </Text>

        <Text style={styles.label}>Crypto Approval</Text>
        <Text style={[styles.value, { 
          color: userData?.cryptoApprovalStatus === 'Approved' ? '#4CAF50' : 
                 userData?.cryptoApprovalStatus === 'Pending' ? '#FF9800' : 
                 userData?.cryptoApprovalStatus === 'Rejected' ? '#F44336' : '#FFD700'
        }]}>
          {userData?.cryptoApprovalStatus || 'Not Requested'}
        </Text>
      </View>
  
      <View style={styles.tokenContainer}>
        <Text style={styles.label}>Access Token</Text>
        <Text style={styles.token}>{userData?.token}</Text>
      </View>
      <View style = {styles.buttonContainer}>
      {/* Only show KYC button if KYC is not completed */}
      {userData?.kycStatus !== 'Verified' && (
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            userData?.kycStatus === 'PendingReview' && styles.disabledButton
          ]} 
          onPress={() => userData?.kycStatus !== 'PendingReview' && router.push('/kyc')}
          disabled={userData?.kycStatus === 'PendingReview'}
        >
          <MaterialIcons 
            name={userData?.kycStatus === 'PendingReview' ? 'hourglass-empty' : 'verified-user'} 
            size={20} 
            color={userData?.kycStatus === 'PendingReview' ? '#FF9800' : '#2E8B57'} 
          />
          <Text style={[
            styles.actionButtonText,
            userData?.kycStatus === 'PendingReview' && styles.disabledButtonText
          ]}>
            {userData?.kycStatus === 'PendingReview' ? 'KYC Pending Review' : 
             userData?.kycStatus === 'Rejected' ? 'Resubmit KYC' : 'Complete KYC'}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Show KYC completed message if verified */}
      {userData?.kycStatus === 'Verified' && (
        <View style={[styles.actionButton, { backgroundColor: '#1B5E20', borderColor: '#4CAF50' }]}>
          <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>KYC Verified ✓</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.actionButton} onPress={() => setIsTradingPermissionsModalVisible(true)}>
        <MaterialIcons name="security" size={20} color="#2E8B57" />
        <Text style={styles.actionButtonText}>Request Trading Permissions</Text>
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

        {/* Trading Permissions Modal */}
        <Modal visible={isTradingPermissionsModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Request Trading Permissions</Text>
              
              <ScrollView style={styles.permissionsScrollView}>
                {/* Required Risk Understanding */}
                <Text style={styles.sectionTitle}>Risk Understanding *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your understanding of trading risks (Required)"
                  placeholderTextColor="#888"
                  value={tradingPermissions.tradingRiskUnderstanding}
                  onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, tradingRiskUnderstanding: value }))}
                  multiline
                  numberOfLines={3}
                />

                {/* Financial Information */}
                <Text style={styles.sectionTitle}>Financial Information *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your liquid assets available for trading (e.g., 50000) *"
                  placeholderTextColor="#888"
                  value={tradingPermissions.liquidAssetsForTrading > 0 ? tradingPermissions.liquidAssetsForTrading.toString() : ''}
                  onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, liquidAssetsForTrading: parseFloat(value) || 0 }))}
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your total investment portfolio value (e.g., 100000) *"
                  placeholderTextColor="#888"
                  value={tradingPermissions.totalInvestmentPortfolioValue > 0 ? tradingPermissions.totalInvestmentPortfolioValue.toString() : ''}
                  onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, totalInvestmentPortfolioValue: parseFloat(value) || 0 }))}
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter percentage of portfolio for trading (e.g., 25) *"
                  placeholderTextColor="#888"
                  value={tradingPermissions.percentageOfPortfolioForTrading > 0 ? tradingPermissions.percentageOfPortfolioForTrading.toString() : ''}
                  onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, percentageOfPortfolioForTrading: parseFloat(value) || 0 }))}
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your emergency fund amount (e.g., 10000) *"
                  placeholderTextColor="#888"
                  value={tradingPermissions.emergencyFundAmount > 0 ? tradingPermissions.emergencyFundAmount.toString() : ''}
                  onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, emergencyFundAmount: parseFloat(value) || 0 }))}
                  keyboardType="numeric"
                />

                {/* Trading Permissions */}
                <Text style={styles.sectionTitle}>Trading Permissions</Text>
                
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, enableMarginTrading: !prev.enableMarginTrading }))}
                  >
                    {tradingPermissions.enableMarginTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>Margin Trading</Text>
                </View>

                {tradingPermissions.enableMarginTrading && (
                  <>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Margin Trading Risk Understanding"
                      placeholderTextColor="#888"
                      value={tradingPermissions.marginTradingRiskUnderstanding || ''}
                      onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, marginTradingRiskUnderstanding: value }))}
                      multiline
                      numberOfLines={2}
                    />
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Margin Trading Experience"
                      placeholderTextColor="#888"
                      value={tradingPermissions.marginTradingExperience || ''}
                      onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, marginTradingExperience: value }))}
                      multiline
                      numberOfLines={2}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter maximum leverage (e.g., 2.0)"
                      placeholderTextColor="#888"
                      value={tradingPermissions.requestedMaxLeverage && tradingPermissions.requestedMaxLeverage > 0 ? tradingPermissions.requestedMaxLeverage.toString() : ''}
                      onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, requestedMaxLeverage: parseFloat(value) || 0 }))}
                      keyboardType="numeric"
                    />
                  </>
                )}

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, enableOptionsTrading: !prev.enableOptionsTrading }))}
                  >
                    {tradingPermissions.enableOptionsTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>Options Trading</Text>
                </View>

                {tradingPermissions.enableOptionsTrading && (
                  <>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Options Trading Risk Understanding"
                      placeholderTextColor="#888"
                      value={tradingPermissions.optionsTradingRiskUnderstanding || ''}
                      onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, optionsTradingRiskUnderstanding: value }))}
                      multiline
                      numberOfLines={2}
                    />
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Options Trading Experience"
                      placeholderTextColor="#888"
                      value={tradingPermissions.optionsTradingExperience || ''}
                      onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, optionsTradingExperience: value }))}
                      multiline
                      numberOfLines={2}
                    />
                  </>
                )}

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, enableCryptoTrading: !prev.enableCryptoTrading }))}
                  >
                    {tradingPermissions.enableCryptoTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>Cryptocurrency Trading</Text>
                </View>

                {tradingPermissions.enableCryptoTrading && (
                  <>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Crypto Trading Risk Understanding"
                      placeholderTextColor="#888"
                      value={tradingPermissions.cryptoTradingRiskUnderstanding || ''}
                      onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, cryptoTradingRiskUnderstanding: value }))}
                      multiline
                      numberOfLines={2}
                    />
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Crypto Trading Experience"
                      placeholderTextColor="#888"
                      value={tradingPermissions.cryptoTradingExperience || ''}
                      onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, cryptoTradingExperience: value }))}
                      multiline
                      numberOfLines={2}
                    />
                  </>
                )}

                {/* Advanced Trading */}
                <Text style={styles.sectionTitle}>Advanced Trading</Text>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, enableShortSelling: !prev.enableShortSelling }))}
                  >
                    {tradingPermissions.enableShortSelling && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>Short Selling</Text>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, enablePennyStockTrading: !prev.enablePennyStockTrading }))}
                  >
                    {tradingPermissions.enablePennyStockTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>Penny Stock Trading</Text>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, enableAfterHoursTrading: !prev.enableAfterHoursTrading }))}
                  >
                    {tradingPermissions.enableAfterHoursTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>After Hours Trading</Text>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, enablePreMarketTrading: !prev.enablePreMarketTrading }))}
                  >
                    {tradingPermissions.enablePreMarketTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>Pre-Market Trading</Text>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, enableInternationalTrading: !prev.enableInternationalTrading }))}
                  >
                    {tradingPermissions.enableInternationalTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>International Trading</Text>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, enableLeveragedETFTrading: !prev.enableLeveragedETFTrading }))}
                  >
                    {tradingPermissions.enableLeveragedETFTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>Leveraged ETF Trading</Text>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, enableInverseETFTrading: !prev.enableInverseETFTrading }))}
                  >
                    {tradingPermissions.enableInverseETFTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>Inverse ETF Trading</Text>
                </View>

                {/* Trading Limits */}
                <Text style={styles.sectionTitle}>Trading Limits</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Enter maximum position size in dollars (e.g., 10000)"
                  placeholderTextColor="#888"
                  value={tradingPermissions.requestedMaxPositionSize && tradingPermissions.requestedMaxPositionSize > 0 ? tradingPermissions.requestedMaxPositionSize.toString() : ''}
                  onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, requestedMaxPositionSize: parseFloat(value) || 0 }))}
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter daily trading limit in dollars (e.g., 50000)"
                  placeholderTextColor="#888"
                  value={tradingPermissions.requestedDailyTradingLimit && tradingPermissions.requestedDailyTradingLimit > 0 ? tradingPermissions.requestedDailyTradingLimit.toString() : ''}
                  onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, requestedDailyTradingLimit: parseFloat(value) || 0 }))}
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter maximum order size in dollars (e.g., 5000)"
                  placeholderTextColor="#888"
                  value={tradingPermissions.requestedMaxOrderSize && tradingPermissions.requestedMaxOrderSize > 0 ? tradingPermissions.requestedMaxOrderSize.toString() : ''}
                  onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, requestedMaxOrderSize: parseFloat(value) || 0 }))}
                  keyboardType="numeric"
                />

                {/* Risk Management */}
                <Text style={styles.sectionTitle}>Risk Management</Text>
                
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Trading Strategy"
                  placeholderTextColor="#888"
                  value={tradingPermissions.tradingStrategy || ''}
                  onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, tradingStrategy: value }))}
                  multiline
                  numberOfLines={2}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Risk Management Approach"
                  placeholderTextColor="#888"
                  value={tradingPermissions.riskManagementApproach || ''}
                  onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, riskManagementApproach: value }))}
                  multiline
                  numberOfLines={2}
                />

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, usesStopLoss: !prev.usesStopLoss }))}
                  >
                    {tradingPermissions.usesStopLoss && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>Uses Stop Loss</Text>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, usesTakeProfit: !prev.usesTakeProfit }))}
                  >
                    {tradingPermissions.usesTakeProfit && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>Uses Take Profit</Text>
                </View>

                {/* Compliance */}
                <Text style={styles.sectionTitle}>Compliance & Legal *</Text>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, understandsRisks: !prev.understandsRisks }))}
                  >
                    {tradingPermissions.understandsRisks && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>I understand the risks involved in trading *</Text>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, canAffordToLose: !prev.canAffordToLose }))}
                  >
                    {tradingPermissions.canAffordToLose && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>I can afford to lose the money invested *</Text>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, hasReadRiskDisclosure: !prev.hasReadRiskDisclosure }))}
                  >
                    {tradingPermissions.hasReadRiskDisclosure && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>I have read and understood the risk disclosure *</Text>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setTradingPermissions(prev => ({ ...prev, agreesToTerms: !prev.agreesToTerms }))}
                  >
                    {tradingPermissions.agreesToTerms && <MaterialIcons name="check" size={20} color="#2E8B57" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxText}>I agree to the terms and conditions *</Text>
                </View>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Additional Comments"
                  placeholderTextColor="#888"
                  value={tradingPermissions.additionalComments || ''}
                  onChangeText={(value) => setTradingPermissions(prev => ({ ...prev, additionalComments: value }))}
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity 
                  style={[styles.submitButton, tradingPermissionsLoading && styles.disabledButton]} 
                  onPress={handleTradingPermissionsSubmit}
                  disabled={tradingPermissionsLoading}
                >
                  {tradingPermissionsLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setIsTradingPermissionsModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
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
    disabledButton: {
        backgroundColor: '#2A2A2A',
        borderColor: '#666',
        opacity: 0.6,
    },
    disabledButtonText: {
        color: '#888',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    permissionsScrollView: {
        maxHeight: 400,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E8B57',
        marginTop: 16,
        marginBottom: 12,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#2E8B57',
        borderRadius: 4,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxText: {
        color: '#FFF',
        fontSize: 14,
        flex: 1,
    },
    input: {
        backgroundColor: '#1E1E1E',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#FFF',
        marginBottom: 12,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    submitButton: {
        backgroundColor: '#2E8B57',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#666',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
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
  });
  
