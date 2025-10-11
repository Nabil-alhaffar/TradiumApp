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
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import axiosInstance from '@/app/services/AxiosInstance';

// Country name to ISO 3-letter code mapping
const countryCodeMap: { [key: string]: string } = {
  'United States': 'USA',
  'Canada': 'CAN',
  'United Kingdom': 'GBR',
  'Australia': 'AUS',
  'Germany': 'DEU',
  'France': 'FRA',
  'Japan': 'JPN',
  'China': 'CHN',
  'India': 'IND',
  'Brazil': 'BRA',
  'Mexico': 'MEX',
  'Spain': 'ESP',
  'Italy': 'ITA',
  'Netherlands': 'NLD',
  'Sweden': 'SWE',
  'Norway': 'NOR',
  'Denmark': 'DNK',
  'Finland': 'FIN',
  'Switzerland': 'CHE',
  'Austria': 'AUT',
  'Belgium': 'BEL',
  'Ireland': 'IRL',
  'Portugal': 'PRT',
  'Poland': 'POL',
  'Czech Republic': 'CZE',
  'Hungary': 'HUN',
  'Romania': 'ROU',
  'Bulgaria': 'BGR',
  'Greece': 'GRC',
  'Turkey': 'TUR',
  'Russia': 'RUS',
  'South Africa': 'ZAF',
  'Egypt': 'EGY',
  'Nigeria': 'NGA',
  'Kenya': 'KEN',
  'Morocco': 'MAR',
  'Tunisia': 'TUN',
  'Algeria': 'DZA',
  'Palestine': 'PSN',
  'United Arab Emirates': 'ARE',
  'Saudi Arabia': 'SAU',
  'Qatar': 'QAT',
  'Kuwait': 'KWT',
  'Bahrain': 'BHR',
  'Oman': 'OMN',
  'Jordan': 'JOR',
  'Lebanon': 'LBN',
  'Pakistan': 'PAK',
  'Bangladesh': 'BGD',
  'Sri Lanka': 'LKA',
  'Thailand': 'THA',
  'Vietnam': 'VNM',
  'Malaysia': 'MYS',
  'Singapore': 'SGP',
  'Indonesia': 'IDN',
  'Philippines': 'PHL',
  'South Korea': 'KOR',
  'Taiwan': 'TWN',
  'Hong Kong': 'HKG',
  'New Zealand': 'NZL',
  'Argentina': 'ARG',
  'Chile': 'CHL',
  'Colombia': 'COL',
  'Peru': 'PER',
  'Venezuela': 'VEN',
  'Uruguay': 'URY',
  'Paraguay': 'PRY',
  'Bolivia': 'BOL',
  'Ecuador': 'ECU',
  'Guyana': 'GUY',
  'Suriname': 'SUR',
  'Syria':'SYR',
  'Iraq':'IRQ',
};

const getCountryCode = (countryName: string): string => {
  return countryCodeMap[countryName] || 'USA'; // Default to USA if not found
};

interface RegisterForm {
  // Basic Information
  userName: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  secondaryEmail: string;
  phoneNumber: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  gender: string;
  
  // Address Information
  streetAddress1: string;
  streetAddress2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryOfResidence: string;
  citizenship: string;
  taxId: string;
  
  // Employment & Financial Information
  employmentStatus: string;
  employerName: string;
  jobTitle: string;
  annualIncome: string;
  netWorth: string;
  liquidNetWorth: string;
  investmentExperience: string;
  investmentObjectives: string[];
  riskTolerance: string;
  investmentTimeHorizon: string;
  
  // Account Information
  accountType: string;
  enableMarginTrading: boolean;
  enableOptionsTrading: boolean;
  enableCryptoTrading: boolean;
  
  // Preferences & Settings
  timeZoneId: string;
  preferredLanguage: string;
  preferredCurrency: string;
  
  // Compliance & Legal
  agreeToTerms: boolean;
  agreeToPrivacyPolicy: boolean;
  agreeToElectronicCommunications: boolean;
  isPoliticallyExposedPerson: boolean;
  hasRegulatoryRestrictions: boolean;
  hasFelonyConviction: boolean;
  hasRegulatoryAction: boolean;
  
  // Security
  securityQuestions: Array<{question: string; answer: string}>;
  enableTwoFactor: boolean;
}

const SignupScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [form, setForm] = useState<RegisterForm>({
    // Basic Information
    userName: '',
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    secondaryEmail: '',
    phoneNumber: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    
    // Address Information
    streetAddress1: '123 Main Street',
    streetAddress2: '',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'United States',
    countryOfResidence: 'United States',
    citizenship: 'United States',
    taxId: '123-45-6789',
    
    // Employment & Financial Information
    employmentStatus: 'EmployedFullTime',
    employerName: 'Tech Company Inc',
    jobTitle: 'Software Engineer',
    annualIncome: 'HundredToHundredFiftyK',
    netWorth: 'HundredToTwoHundredFiftyK',
    liquidNetWorth: 'FiftyToHundredK',
    investmentExperience: 'Some',
    investmentObjectives: ['Growth'], // Growth
    riskTolerance: 'Moderate',
    investmentTimeHorizon: 'FiveToTenYears', // Long term
    
    // Account Information
    accountType: 'Individual', // Individual
    enableMarginTrading: false,
    enableOptionsTrading: false,
    enableCryptoTrading: false,
    
    // Preferences & Settings
    timeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
    preferredLanguage: 'en-US',
    preferredCurrency: 'USD',
    
    // Compliance & Legal
    agreeToTerms: false,
    agreeToPrivacyPolicy: false,
    agreeToElectronicCommunications: false,
    isPoliticallyExposedPerson: false,
    hasRegulatoryRestrictions: false,
    hasFelonyConviction: false,
    hasRegulatoryAction: false,
    
    // Security
    securityQuestions: [
      { question: 'What is your mother\'s maiden name?', answer: 'Smith' },
      { question: 'What city were you born in?', answer: 'New York' },
      { question: 'What was the name of your first pet?', answer: 'Buddy' }
    ],
    enableTwoFactor: false,
  });

  const updateForm = (field: keyof RegisterForm, value: string | boolean | number | string[] | Array<{question: string; answer: string}>) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep1 = () => {
    if (!form.userName.trim()) {
      setError('Username is required');
      return false;
    }
    if (!form.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!form.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!form.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!form.streetAddress1.trim()) {
      setError('Street address is required');
      return false;
    }
    if (!form.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!form.state.trim()) {
      setError('State is required');
      return false;
    }
    if (!form.postalCode.trim()) {
      setError('Postal code is required');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!form.employerName.trim()) {
      setError('Employer name is required');
      return false;
    }
    if (!form.jobTitle.trim()) {
      setError('Job title is required');
      return false;
    }
    return true;
  };

  const validateStep5 = () => {
    if (!form.agreeToTerms) {
      setError('You must agree to the Terms of Service');
      return false;
    }
    if (!form.agreeToPrivacyPolicy) {
      setError('You must agree to the Privacy Policy');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(4);
    } else if (currentStep === 4 && validateStep4()) {
      setCurrentStep(5);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSignup = async () => {
    if (!validateStep5()) return;

    setLoading(true);
    setError(null);

    try {
      const registerData = {
        // Basic Information
        userName: form.userName,
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || null,
        email: form.email,
        secondaryEmail: form.secondaryEmail || null,
        phoneNumber: form.phoneNumber,
        mobileNumber: form.mobileNumber,
        password: form.password,
        confirmPassword: form.confirmPassword,
        dateOfBirth: new Date(form.dateOfBirth),
        gender: form.gender,
        
        // Address Information
        residentialAddress: {
          streetAddress1: form.streetAddress1,
          streetAddress2: form.streetAddress2 || null,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: getCountryCode(form.country),
        },
        mailingAddress: null, // Optional
        countryOfResidence: getCountryCode(form.countryOfResidence),
        citizenship: getCountryCode(form.citizenship),
        taxId: form.taxId || null,
        
        // Employment & Financial Information
        employmentStatus: form.employmentStatus,
        employerName: form.employerName || null,
        jobTitle: form.jobTitle || null,
        annualIncome: form.annualIncome,
        netWorth: form.netWorth,
        liquidNetWorth: form.liquidNetWorth,
        investmentExperience: form.investmentExperience,
        investmentObjectives: form.investmentObjectives,
        riskTolerance: form.riskTolerance,
        investmentTimeHorizon: form.investmentTimeHorizon,
        
        // Account Information
        accountType: form.accountType,
        enableMarginTrading: form.enableMarginTrading,
        enableOptionsTrading: form.enableOptionsTrading,
        enableCryptoTrading: form.enableCryptoTrading,
        
        // Preferences & Settings
        timeZoneId: form.timeZoneId,
        preferredLanguage: form.preferredLanguage,
        preferredCurrency: form.preferredCurrency,
        notificationPreferences: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          tradeConfirmations: true,
          marginCallAlerts: true,
          priceAlerts: true,
          newsAlerts: false,
          marketingEmails: false,
        },
        tradingPreferences: {
          confirmTrades: true,
          showPnL: true,
          autoSaveCharts: false,
          defaultOrderType: 'Market',
          defaultOrderDuration: 1,
        },
        privacySettings: {
          sharePortfolioData: false,
          shareTradingActivity: false,
          allowAnalytics: true,
          allowMarketing: false,
        },
        
        // Compliance & Legal
        agreeToTerms: form.agreeToTerms,
        agreeToPrivacyPolicy: form.agreeToPrivacyPolicy,
        agreeToElectronicCommunications: form.agreeToElectronicCommunications,
        isPoliticallyExposedPerson: form.isPoliticallyExposedPerson,
        hasRegulatoryRestrictions: form.hasRegulatoryRestrictions,
        hasFelonyConviction: form.hasFelonyConviction,
        hasRegulatoryAction: form.hasRegulatoryAction,
        
        // Security
        securityQuestions: form.securityQuestions.map(q => ({
          question: q.question,
          answer: q.answer
        })),
        enableTwoFactor: form.enableTwoFactor,
      };

      const response = await axiosInstance.post('/auth/register', registerData);

      Toast.show({
        type: 'success',
        text1: 'Registration successful!',
        text2: 'Welcome to Tradium!',
      });

      // Navigate to login screen
      router.replace('/login');
    } catch (error: any) {
      console.error('Signup failed:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#888"
        value={form.userName}
        onChangeText={(value) => updateForm('userName', value)}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="First Name"
        placeholderTextColor="#888"
        value={form.firstName}
        onChangeText={(value) => updateForm('firstName', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        placeholderTextColor="#888"
        value={form.lastName}
        onChangeText={(value) => updateForm('lastName', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Middle Name (Optional)"
        placeholderTextColor="#888"
        value={form.middleName}
        onChangeText={(value) => updateForm('middleName', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor="#888"
        value={form.email}
        onChangeText={(value) => updateForm('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Security & Contact</Text>
      
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Password"
          placeholderTextColor="#888"
          value={form.password}
          onChangeText={(value) => updateForm('password', value)}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <MaterialIcons
            name={showPassword ? 'visibility' : 'visibility-off'}
            size={24}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          value={form.confirmPassword}
          onChangeText={(value) => updateForm('confirmPassword', value)}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <MaterialIcons
            name={showConfirmPassword ? 'visibility' : 'visibility-off'}
            size={24}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        placeholderTextColor="#888"
        value={form.phoneNumber}
        onChangeText={(value) => updateForm('phoneNumber', value)}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Mobile Number"
        placeholderTextColor="#888"
        value={form.mobileNumber}
        onChangeText={(value) => updateForm('mobileNumber', value)}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Secondary Email (Optional)"
        placeholderTextColor="#888"
        value={form.secondaryEmail}
        onChangeText={(value) => updateForm('secondaryEmail', value)}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        placeholderTextColor="#888"
        value={form.dateOfBirth}
        onChangeText={(value) => updateForm('dateOfBirth', value)}
        keyboardType="numeric"
        maxLength={10}
      />

      <Text style={styles.label}>Gender:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('gender', 'Male')}
        >
          {form.gender === 'Male' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.gender !== 'Male' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('gender', 'Female')}
        >
          {form.gender === 'Female' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.gender !== 'Female' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Female</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('gender', 'PreferNotToSay')}
        >
          {form.gender === 'PreferNotToSay' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.gender !== 'PreferNotToSay' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Prefer not to say</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.rowContainer, { marginTop: 20 }]}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Country of Residence"
          placeholderTextColor="#888"
          value={form.countryOfResidence}
          onChangeText={(value) => updateForm('countryOfResidence', value)}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Citizenship"
          placeholderTextColor="#888"
          value={form.citizenship}
          onChangeText={(value) => updateForm('citizenship', value)}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Address Information</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Street Address 1"
        placeholderTextColor="#888"
        value={form.streetAddress1}
        onChangeText={(value) => updateForm('streetAddress1', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Street Address 2 (Optional)"
        placeholderTextColor="#888"
        value={form.streetAddress2}
        onChangeText={(value) => updateForm('streetAddress2', value)}
      />

      <View style={styles.rowContainer}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="City"
          placeholderTextColor="#888"
          value={form.city}
          onChangeText={(value) => updateForm('city', value)}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="State"
          placeholderTextColor="#888"
          value={form.state}
          onChangeText={(value) => updateForm('state', value)}
        />
      </View>

      <View style={styles.rowContainer}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Postal Code"
          placeholderTextColor="#888"
          value={form.postalCode}
          onChangeText={(value) => updateForm('postalCode', value)}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Country"
          placeholderTextColor="#888"
          value={form.country}
          onChangeText={(value) => updateForm('country', value)}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Tax ID / SSN (Optional)"
        placeholderTextColor="#888"
        value={form.taxId}
        onChangeText={(value) => updateForm('taxId', value)}
        secureTextEntry
      />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Employment & Financial Information</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Employer Name"
        placeholderTextColor="#888"
        value={form.employerName}
        onChangeText={(value) => updateForm('employerName', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Job Title"
        placeholderTextColor="#888"
        value={form.jobTitle}
        onChangeText={(value) => updateForm('jobTitle', value)}
      />

      <Text style={styles.label}>Employment Status:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('employmentStatus', 'EmployedFullTime')}
        >
          {form.employmentStatus === 'EmployedFullTime' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.employmentStatus !== 'EmployedFullTime' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Full-Time</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('employmentStatus', 'EmployedPartTime')}
        >
          {form.employmentStatus === 'EmployedPartTime' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.employmentStatus !== 'EmployedPartTime' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Part-Time</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('employmentStatus', 'SelfEmployed')}
        >
          {form.employmentStatus === 'SelfEmployed' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.employmentStatus !== 'SelfEmployed' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Self-Employed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('employmentStatus', 'Student')}
        >
          {form.employmentStatus === 'Student' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.employmentStatus !== 'Student' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Student</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('employmentStatus', 'Retired')}
        >
          {form.employmentStatus === 'Retired' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.employmentStatus !== 'Retired' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Retired</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('employmentStatus', 'Unemployed')}
        >
          {form.employmentStatus === 'Unemployed' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.employmentStatus !== 'Unemployed' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Unemployed</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Annual Income:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('annualIncome', 'LessThan25K')}
        >
          {form.annualIncome === 'LessThan25K' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.annualIncome !== 'LessThan25K' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Less than $25K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('annualIncome', 'TwentyFiveToFiftyK')}
        >
          {form.annualIncome === 'TwentyFiveToFiftyK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.annualIncome !== 'TwentyFiveToFiftyK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$25K-$50K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('annualIncome', 'FiftyToSeventyFiveK')}
        >
          {form.annualIncome === 'FiftyToSeventyFiveK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.annualIncome !== 'FiftyToSeventyFiveK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$50K-$75K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('annualIncome', 'SeventyFiveToHundredK')}
        >
          {form.annualIncome === 'SeventyFiveToHundredK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.annualIncome !== 'SeventyFiveToHundredK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$75K-$100K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('annualIncome', 'HundredToHundredFiftyK')}
        >
          {form.annualIncome === 'HundredToHundredFiftyK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.annualIncome !== 'HundredToHundredFiftyK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$100K-$150K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('annualIncome', 'HundredFiftyToTwoHundredK')}
        >
          {form.annualIncome === 'HundredFiftyToTwoHundredK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.annualIncome !== 'HundredFiftyToTwoHundredK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$150K-$200K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('annualIncome', 'TwoHundredToThreeHundredK')}
        >
          {form.annualIncome === 'TwoHundredToThreeHundredK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.annualIncome !== 'TwoHundredToThreeHundredK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$200K-$300K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('annualIncome', 'ThreeHundredToFiveHundredK')}
        >
          {form.annualIncome === 'ThreeHundredToFiveHundredK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.annualIncome !== 'ThreeHundredToFiveHundredK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$300K-$500K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('annualIncome', 'FiveHundredToMillion')}
        >
          {form.annualIncome === 'FiveHundredToMillion' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.annualIncome !== 'FiveHundredToMillion' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$500K-$1M</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('annualIncome', 'MillionPlus')}
        >
          {form.annualIncome === 'MillionPlus' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.annualIncome !== 'MillionPlus' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$1M+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('annualIncome', 'PreferNotToSay')}
        >
          {form.annualIncome === 'PreferNotToSay' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.annualIncome !== 'PreferNotToSay' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Prefer not to say</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Net Worth:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('netWorth', 'LessThan10K')}
        >
          {form.netWorth === 'LessThan10K' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.netWorth !== 'LessThan10K' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Less than $10K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('netWorth', 'TenToTwentyFiveK')}
        >
          {form.netWorth === 'TenToTwentyFiveK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.netWorth !== 'TenToTwentyFiveK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$10K-$25K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('netWorth', 'TwentyFiveToFiftyK')}
        >
          {form.netWorth === 'TwentyFiveToFiftyK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.netWorth !== 'TwentyFiveToFiftyK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$25K-$50K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('netWorth', 'FiftyToHundredK')}
        >
          {form.netWorth === 'FiftyToHundredK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.netWorth !== 'FiftyToHundredK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$50K-$100K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('netWorth', 'HundredToTwoHundredFiftyK')}
        >
          {form.netWorth === 'HundredToTwoHundredFiftyK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.netWorth !== 'HundredToTwoHundredFiftyK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$100K-$250K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('netWorth', 'TwoHundredFiftyToFiveHundredK')}
        >
          {form.netWorth === 'TwoHundredFiftyToFiveHundredK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.netWorth !== 'TwoHundredFiftyToFiveHundredK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$250K-$500K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('netWorth', 'FiveHundredToMillion')}
        >
          {form.netWorth === 'FiveHundredToMillion' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.netWorth !== 'FiveHundredToMillion' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$500K-$1M</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('netWorth', 'MillionToTwoAndHalfMillion')}
        >
          {form.netWorth === 'MillionToTwoAndHalfMillion' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.netWorth !== 'MillionToTwoAndHalfMillion' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$1M-$2.5M</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('netWorth', 'TwoAndHalfToFiveMillion')}
        >
          {form.netWorth === 'TwoAndHalfToFiveMillion' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.netWorth !== 'TwoAndHalfToFiveMillion' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$2.5M-$5M</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('netWorth', 'FiveMillionPlus')}
        >
          {form.netWorth === 'FiveMillionPlus' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.netWorth !== 'FiveMillionPlus' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$5M+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('netWorth', 'PreferNotToSay')}
        >
          {form.netWorth === 'PreferNotToSay' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.netWorth !== 'PreferNotToSay' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Prefer not to say</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Liquid Net Worth:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('liquidNetWorth', 'LessThan10K')}
        >
          {form.liquidNetWorth === 'LessThan10K' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.liquidNetWorth !== 'LessThan10K' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Less than $10K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('liquidNetWorth', 'TenToTwentyFiveK')}
        >
          {form.liquidNetWorth === 'TenToTwentyFiveK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.liquidNetWorth !== 'TenToTwentyFiveK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$10K-$25K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('liquidNetWorth', 'TwentyFiveToFiftyK')}
        >
          {form.liquidNetWorth === 'TwentyFiveToFiftyK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.liquidNetWorth !== 'TwentyFiveToFiftyK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$25K-$50K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('liquidNetWorth', 'FiftyToHundredK')}
        >
          {form.liquidNetWorth === 'FiftyToHundredK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.liquidNetWorth !== 'FiftyToHundredK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$50K-$100K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('liquidNetWorth', 'HundredToTwoHundredFiftyK')}
        >
          {form.liquidNetWorth === 'HundredToTwoHundredFiftyK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.liquidNetWorth !== 'HundredToTwoHundredFiftyK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$100K-$250K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('liquidNetWorth', 'TwoHundredFiftyToFiveHundredK')}
        >
          {form.liquidNetWorth === 'TwoHundredFiftyToFiveHundredK' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.liquidNetWorth !== 'TwoHundredFiftyToFiveHundredK' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$250K-$500K</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('liquidNetWorth', 'FiveHundredToMillion')}
        >
          {form.liquidNetWorth === 'FiveHundredToMillion' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.liquidNetWorth !== 'FiveHundredToMillion' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$500K-$1M</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('liquidNetWorth', 'MillionToTwoAndHalfMillion')}
        >
          {form.liquidNetWorth === 'MillionToTwoAndHalfMillion' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.liquidNetWorth !== 'MillionToTwoAndHalfMillion' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$1M-$2.5M</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('liquidNetWorth', 'TwoAndHalfToFiveMillion')}
        >
          {form.liquidNetWorth === 'TwoAndHalfToFiveMillion' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.liquidNetWorth !== 'TwoAndHalfToFiveMillion' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$2.5M-$5M</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('liquidNetWorth', 'FiveMillionPlus')}
        >
          {form.liquidNetWorth === 'FiveMillionPlus' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.liquidNetWorth !== 'FiveMillionPlus' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>$5M+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('liquidNetWorth', 'PreferNotToSay')}
        >
          {form.liquidNetWorth === 'PreferNotToSay' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.liquidNetWorth !== 'PreferNotToSay' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Prefer not to say</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Investment Experience:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentExperience', 'None')}
        >
          {form.investmentExperience === 'None' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentExperience !== 'None' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>None</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentExperience', 'Limited')}
        >
          {form.investmentExperience === 'Limited' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentExperience !== 'Limited' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Limited</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentExperience', 'Some')}
        >
          {form.investmentExperience === 'Some' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentExperience !== 'Some' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Some</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentExperience', 'Moderate')}
        >
          {form.investmentExperience === 'Moderate' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentExperience !== 'Moderate' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Moderate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentExperience', 'Good')}
        >
          {form.investmentExperience === 'Good' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentExperience !== 'Good' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Good</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentExperience', 'Extensive')}
        >
          {form.investmentExperience === 'Extensive' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentExperience !== 'Extensive' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Extensive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentExperience', 'Professional')}
        >
          {form.investmentExperience === 'Professional' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentExperience !== 'Professional' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Professional</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Risk Tolerance:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('riskTolerance', 'VeryConservative')}
        >
          {form.riskTolerance === 'VeryConservative' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.riskTolerance !== 'VeryConservative' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Very Conservative</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('riskTolerance', 'Conservative')}
        >
          {form.riskTolerance === 'Conservative' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.riskTolerance !== 'Conservative' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Conservative</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('riskTolerance', 'Moderate')}
        >
          {form.riskTolerance === 'Moderate' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.riskTolerance !== 'Moderate' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Moderate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('riskTolerance', 'Aggressive')}
        >
          {form.riskTolerance === 'Aggressive' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.riskTolerance !== 'Aggressive' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Aggressive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('riskTolerance', 'VeryAggressive')}
        >
          {form.riskTolerance === 'VeryAggressive' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.riskTolerance !== 'VeryAggressive' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Very Aggressive</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Investment Objectives:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentObjectives', ['CapitalPreservation'])}
        >
          {form.investmentObjectives.includes('CapitalPreservation') && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {!form.investmentObjectives.includes('CapitalPreservation') && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Capital Preservation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentObjectives', ['IncomeGeneration'])}
        >
          {form.investmentObjectives.includes('IncomeGeneration') && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {!form.investmentObjectives.includes('IncomeGeneration') && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Income Generation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentObjectives', ['Growth'])}
        >
          {form.investmentObjectives.includes('Growth') && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {!form.investmentObjectives.includes('Growth') && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Growth</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentObjectives', ['AggressiveGrowth'])}
        >
          {form.investmentObjectives.includes('AggressiveGrowth') && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {!form.investmentObjectives.includes('AggressiveGrowth') && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Aggressive Growth</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentObjectives', ['RetirementPlanning'])}
        >
          {form.investmentObjectives.includes('RetirementPlanning') && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {!form.investmentObjectives.includes('RetirementPlanning') && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Retirement Planning</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Investment Time Horizon:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentTimeHorizon', 'LessThanOneYear')}
        >
          {form.investmentTimeHorizon === 'LessThanOneYear' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentTimeHorizon !== 'LessThanOneYear' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Less than 1 year</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentTimeHorizon', 'OneToThreeYears')}
        >
          {form.investmentTimeHorizon === 'OneToThreeYears' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentTimeHorizon !== 'OneToThreeYears' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>1-3 years</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentTimeHorizon', 'ThreeToFiveYears')}
        >
          {form.investmentTimeHorizon === 'ThreeToFiveYears' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentTimeHorizon !== 'ThreeToFiveYears' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>3-5 years</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentTimeHorizon', 'FiveToTenYears')}
        >
          {form.investmentTimeHorizon === 'FiveToTenYears' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentTimeHorizon !== 'FiveToTenYears' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>5-10 years</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentTimeHorizon', 'TenToTwentyYears')}
        >
          {form.investmentTimeHorizon === 'TenToTwentyYears' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentTimeHorizon !== 'TenToTwentyYears' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>10-20 years</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('investmentTimeHorizon', 'MoreThanTwentyYears')}
        >
          {form.investmentTimeHorizon === 'MoreThanTwentyYears' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.investmentTimeHorizon !== 'MoreThanTwentyYears' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>More than 20 years</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Account Type:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('accountType', 'Individual')}
        >
          {form.accountType === 'Individual' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.accountType !== 'Individual' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Individual</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('accountType', 'Joint')}
        >
          {form.accountType === 'Joint' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.accountType !== 'Joint' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Joint</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('accountType', 'IRA')}
        >
          {form.accountType === 'IRA' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.accountType !== 'IRA' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>IRA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => updateForm('accountType', 'RothIRA')}
        >
          {form.accountType === 'RothIRA' && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
          {form.accountType !== 'RothIRA' && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
          <Text style={styles.radioText}>Roth IRA</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Enable Trading Features:</Text>
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateForm('enableMarginTrading', !form.enableMarginTrading)}
        >
          {form.enableMarginTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>Margin Trading</Text>
      </View>
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateForm('enableOptionsTrading', !form.enableOptionsTrading)}
        >
          {form.enableOptionsTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>Options Trading</Text>
      </View>
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateForm('enableCryptoTrading', !form.enableCryptoTrading)}
        >
          {form.enableCryptoTrading && <MaterialIcons name="check" size={20} color="#2E8B57" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>Crypto Trading</Text>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Security Questions & Terms</Text>
      
      <Text style={styles.sectionTitle}>Security Questions</Text>
      <Text style={styles.label}>Question 1:</Text>
      <TextInput
        style={styles.input}
        placeholder="Security Question 1"
        placeholderTextColor="#888"
        value={form.securityQuestions[0]?.question || ''}
        onChangeText={(value) => {
          const newQuestions = [...form.securityQuestions];
          newQuestions[0] = { ...newQuestions[0], question: value };
          updateForm('securityQuestions', newQuestions);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Answer"
        placeholderTextColor="#888"
        value={form.securityQuestions[0]?.answer || ''}
        onChangeText={(value) => {
          const newQuestions = [...form.securityQuestions];
          newQuestions[0] = { ...newQuestions[0], answer: value };
          updateForm('securityQuestions', newQuestions);
        }}
      />

      <Text style={styles.label}>Question 2:</Text>
      <TextInput
        style={styles.input}
        placeholder="Security Question 2"
        placeholderTextColor="#888"
        value={form.securityQuestions[1]?.question || ''}
        onChangeText={(value) => {
          const newQuestions = [...form.securityQuestions];
          newQuestions[1] = { ...newQuestions[1], question: value };
          updateForm('securityQuestions', newQuestions);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Answer"
        placeholderTextColor="#888"
        value={form.securityQuestions[1]?.answer || ''}
        onChangeText={(value) => {
          const newQuestions = [...form.securityQuestions];
          newQuestions[1] = { ...newQuestions[1], answer: value };
          updateForm('securityQuestions', newQuestions);
        }}
      />

      <Text style={styles.label}>Question 3:</Text>
      <TextInput
        style={styles.input}
        placeholder="Security Question 3"
        placeholderTextColor="#888"
        value={form.securityQuestions[2]?.question || ''}
        onChangeText={(value) => {
          const newQuestions = [...form.securityQuestions];
          newQuestions[2] = { ...newQuestions[2], question: value };
          updateForm('securityQuestions', newQuestions);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Answer"
        placeholderTextColor="#888"
        value={form.securityQuestions[2]?.answer || ''}
        onChangeText={(value) => {
          const newQuestions = [...form.securityQuestions];
          newQuestions[2] = { ...newQuestions[2], answer: value };
          updateForm('securityQuestions', newQuestions);
        }}
      />

      <Text style={styles.sectionTitle}>Terms & Conditions</Text>
      
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateForm('agreeToTerms', !form.agreeToTerms)}
        >
          {form.agreeToTerms && <MaterialIcons name="check" size={20} color="#2E8B57" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          I agree to the Terms of Service and understand the risks involved in trading.
        </Text>
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateForm('agreeToPrivacyPolicy', !form.agreeToPrivacyPolicy)}
        >
          {form.agreeToPrivacyPolicy && <MaterialIcons name="check" size={20} color="#2E8B57" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          I agree to the Privacy Policy and consent to data processing.
        </Text>
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateForm('agreeToElectronicCommunications', !form.agreeToElectronicCommunications)}
        >
          {form.agreeToElectronicCommunications && <MaterialIcons name="check" size={20} color="#2E8B57" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          I agree to receive electronic communications and notifications.
        </Text>
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateForm('enableTwoFactor', !form.enableTwoFactor)}
        >
          {form.enableTwoFactor && <MaterialIcons name="check" size={20} color="#2E8B57" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          Enable two-factor authentication for enhanced security.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Compliance & Legal</Text>
      
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateForm('isPoliticallyExposedPerson', !form.isPoliticallyExposedPerson)}
        >
          {form.isPoliticallyExposedPerson && <MaterialIcons name="check" size={20} color="#2E8B57" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          I am a politically exposed person (PEP).
        </Text>
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateForm('hasRegulatoryRestrictions', !form.hasRegulatoryRestrictions)}
        >
          {form.hasRegulatoryRestrictions && <MaterialIcons name="check" size={20} color="#2E8B57" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          I have regulatory restrictions that may affect my trading activities.
        </Text>
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateForm('hasFelonyConviction', !form.hasFelonyConviction)}
        >
          {form.hasFelonyConviction && <MaterialIcons name="check" size={20} color="#2E8B57" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          I have been convicted of a felony.
        </Text>
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateForm('hasRegulatoryAction', !form.hasRegulatoryAction)}
        >
          {form.hasRegulatoryAction && <MaterialIcons name="check" size={20} color="#2E8B57" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          I have been subject to regulatory action or investigation.
        </Text>
      </View>

      <Text style={styles.disclaimerText}>
        By creating an account, you acknowledge that you are at least 18 years old and agree to our terms. 
        Trading involves risk and you may lose money. After registration, you'll need to complete KYC verification to enable trading.
      </Text>
    </View>
  );


  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/tradium-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={handlePrevious}>
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentStep < totalSteps ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleSignup} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 30,
    paddingTop: 50,
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2F2F2F',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E8B57',
    borderRadius: 2,
  },
  progressText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  stepContainer: {
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 20,
    fontWeight: '600',
    textAlign: 'center',
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
  passwordContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 13,
    padding: 5,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
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
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  disclaimerText: {
    color: '#888',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#2E8B57',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    borderColor: '#2E8B57',
    borderWidth: 1,
    flex: 1,
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2E8B57',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loginLinkText: {
    color: '#888',
    fontSize: 14,
  },
  loginLinkBold: {
    color: '#2E8B57',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF5A5F',
    marginBottom: 15,
    fontSize: 14,
    textAlign: 'center',
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radioText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '500',
  },
  helpText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 15,
    fontStyle: 'italic',
  },
});
