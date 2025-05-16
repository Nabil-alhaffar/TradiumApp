import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

interface Transfer {
  transactionId: string;
  userId: string;
  amount: number;
  description: string;
  type: string;
  timestamp: Date;
}

let token: string | null = null;
let userId: string | null = null;

const getTransferStyle = (type: string) => {
  const lower = type.toLowerCase();

  if (lower === 'deposit') {
    return {
      icon: 'arrow-downward',
      color: '#00FF00',
    };
  } else if (lower === 'withdrawal') {
    return {
      icon: 'arrow-upward',
      color: '#FF5252',
    };
  } else {
    return {
      icon: 'compare-arrows',
      color: '#FFD700',
    };
  }
};

export default function TransfersScreen() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        token = Platform.OS === 'web'
          ? await AsyncStorage.getItem('userToken')
          : await SecureStore.getItemAsync('userToken');
        userId = Platform.OS === 'web'
          ? await AsyncStorage.getItem('userId')
          : await SecureStore.getItemAsync('userId');

        const response = await axios.get(`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/CashFlowLog/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTransfers(response.data);
      } catch (error) {
        setError('Failed to load cash flow log.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  const openActionModal = (type: 'deposit' | 'withdrawal') => {
    setActionType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setAmount('');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid number for the amount');
      if (!amount || isNaN(Number(amount))) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Amount',
          text2: 'Please enter a valid amount. ',
        });
        return;
      }
      return;
    }

    if (Number(amount) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Amount must be greater than 0',
      });
      return;
    }

    setProcessing(true);

    try {
      const parsedAmount = parseFloat(amount)
      // const requestData = {
      //   // description: description || `${actionType}`,
      //   ...(actionType === 'deposit' 
      //     ? { depositAmount: Number(amount) }
      //     : { withdrawalAmount: Number(amount) })
      // };
      const endpoint = actionType === 'deposit' 
        ? `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/Portfolio/deposit-funds/${userId}?depositAmount=${parsedAmount}`
        : `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/portfolio/Withdraw-funds/${userId}?withdrawAmount=${parsedAmount}`;
      

      const response = await axios.post(
        endpoint,
        null,
        // requestData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      

      // Refresh transfers after successful action
      const updatedResponse = await axios.get(`https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/CashFlowLog/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransfers(updatedResponse.data);
      Toast.show({
        type: 'success',
        text1: `${actionType === 'deposit' ? 'Deposit' : 'Withdrawal'} Successful`,
        text2: `Your ${actionType} of $${parsedAmount.toFixed(2)} was processed.`,
      });
      Alert.alert('Success', `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} was successful!`);
      closeModal();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Transaction Failed',
        text2: `Unable to complete ${actionType}. Please try again.`,
      });
      Alert.alert('Error', `Failed to process ${actionType}. Please try again.`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00ffcc" />
        <Text style={styles.text}>Loading cash flow log...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Transfers</Text>
      
      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.depositButton]}
          onPress={() => openActionModal('deposit')}
        >
          <MaterialIcons name="arrow-downward" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Deposit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.withdrawalButton]}
          onPress={() => openActionModal('withdrawal')}
        >
          <MaterialIcons name="arrow-upward" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Action Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'deposit' ? 'Make a Deposit' : 'Make a Withdrawal'}
            </Text>
            
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              autoFocus={true}
            />
            
            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder={`${actionType === 'deposit' ? 'Deposit' : 'Withdrawal'} description`}
              value={description}
              onChangeText={setDescription}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
                disabled={processing}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, actionType === 'deposit' ? styles.depositButton : styles.withdrawalButton]}
                onPress={handleSubmit}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {actionType === 'deposit' ? 'Deposit' : 'Withdraw'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {transfers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No transactions available.</Text>
        </View>
      ) : (
        transfers.map((transfer) => {
          // const isDeposit = transfer.type.toLowerCase() === 'deposit';
          // const isWithdrawal = transfer.type.toLowerCase() === 'withdrawal';
          const { icon, color } = getTransferStyle(transfer.type);

          return (
            <View
              key={transfer.transactionId}
              style={[styles.card, { borderLeftColor: color }]}

            >
              <View style={styles.row}>
                <MaterialIcons
                name={icon} size={24} color={color}
                  // name={isDeposit ? 'arrow-downward' : isWithdrawal ? 'arrow-upward' : 'compare-arrows'}
                  // size={24}
                  // color={isDeposit ? '#00FF00' : isWithdrawal ? '#FF5252' : '#FFD700'}
                />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.type}>{transfer.type}</Text>
                  <Text style={styles.description}>{transfer.description}</Text>
                </View>
                <Text style={[styles.amount, { color }]}>
                  {transfer.type.toLowerCase() === 'deposit' ? '+' : '-'}
                  ${transfer.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <Text style={styles.date}>{new Date(transfer.timestamp).toLocaleString()}</Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16, textAlign: 'center' },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  type: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  description: {
    fontSize: 12,
    color: '#CCC',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 'auto',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#ccc', fontSize: 16, marginTop: 10 },
  errorText: { color: '#ff4d4d', fontSize: 16 },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#ccc',
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '45%',
    justifyContent: 'center',
  },
  depositButton: {
    backgroundColor: '#00AA00',
  },
  withdrawalButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    color: '#ccc',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#2e2e2e',
    color: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
