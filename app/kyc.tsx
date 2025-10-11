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
import { MaterialIcons } from '@expo/vector-icons';
import axiosInstance from '@/app/services/AxiosInstance';
import Toast from 'react-native-toast-message';

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
  'Israel': 'ISR',
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
};

const getCountryCode = (countryName: string): string => {
  return countryCodeMap[countryName] || 'USA'; // Default to USA if not found
};

interface KycForm {
  // Personal Information
  dateOfBirth: string;
  gender: number;
  
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
  employmentStatus: number;
  employerName: string;
  jobTitle: string;
  annualIncome: number;
  netWorth: number;
  liquidNetWorth: number;
  investmentExperience: number;
  investmentObjectives: number[];
  riskTolerance: number;
  investmentTimeHorizon: number;
  
  // Compliance & Legal
  isPoliticallyExposedPerson: boolean;
  hasRegulatoryRestrictions: boolean;
  hasFelonyConviction: boolean;
  hasRegulatoryAction: boolean;
  sourceOfFunds: string;
  expectedAnnualTradingVolume: number;
  expectedMaxPositionSize: number;
  
  // Documentation
  idDocumentType: string;
  idDocumentNumber: string;
  idDocumentExpiryDate: string;
  idDocumentIssuingCountry: string;
  proofOfAddressDocumentType: string;
  proofOfAddressDocumentNumber: string;
  proofOfAddressDocumentIssueDate: string;
  
  // Additional Information
  additionalComments: string;
  agreeToElectronicCommunications: boolean;
  agreeToTerms: boolean;
  agreeToPrivacyPolicy: boolean;
}

const KycScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [form, setForm] = useState<KycForm>({
    // Personal Information
    dateOfBirth: '1990-01-01',
    gender: 1,
    
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
    employmentStatus: 1,
    employerName: 'Tech Company Inc',
    jobTitle: 'Software Engineer',
    annualIncome: 75000,
    netWorth: 100000,
    liquidNetWorth: 50000,
    investmentExperience: 2,
    investmentObjectives: [1], // Growth
    riskTolerance: 3,
    investmentTimeHorizon: 2, // Long term
    
    // Compliance & Legal
    isPoliticallyExposedPerson: false,
    hasRegulatoryRestrictions: false,
    hasFelonyConviction: false,
    hasRegulatoryAction: false,
    sourceOfFunds: 'Employment income and savings',
    expectedAnnualTradingVolume: 100000,
    expectedMaxPositionSize: 50000,
    
    // Documentation
    idDocumentType: 'Passport',
    idDocumentNumber: 'A1234567',
    idDocumentExpiryDate: '2030-12-31',
    idDocumentIssuingCountry: 'United States',
    proofOfAddressDocumentType: 'Utility Bill',
    proofOfAddressDocumentNumber: 'UTIL-123456',
    proofOfAddressDocumentIssueDate: '2024-01-01',
    
    // Additional Information
    additionalComments: 'All information provided is accurate and complete.',
    agreeToElectronicCommunications: true,
    agreeToTerms: true,
    agreeToPrivacyPolicy: true,
  });

  const updateForm = (field: keyof KycForm, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep1 = () => {
    if (!form.dateOfBirth) {
      setError('Date of birth is required');
      return false;
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(form.dateOfBirth)) {
      setError('Date must be in YYYY-MM-DD format');
      return false;
    }
    
    // Validate date is valid
    const date = new Date(form.dateOfBirth);
    if (isNaN(date.getTime())) {
      setError('Please enter a valid date');
      return false;
    }
    
    if (form.gender === 0) {
      setError('Please select your gender');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
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
    if (!form.country.trim()) {
      setError('Country is required');
      return false;
    }
    if (!form.countryOfResidence.trim()) {
      setError('Country of residence is required');
      return false;
    }
    if (!form.citizenship.trim()) {
      setError('Citizenship is required');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!form.taxId.trim()) {
      setError('Tax ID is required');
      return false;
    }
    if (!form.idDocumentNumber.trim()) {
      setError('ID Document Number is required');
      return false;
    }
    if (!form.idDocumentIssuingCountry.trim()) {
      setError('ID Document Issuing Country is required');
      return false;
    }
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

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(4);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const validateStep4 = () => {
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

  const handleKycSubmit = async () => {
    if (!validateStep4()) return;

    setLoading(true);
    setError(null);

    try {
      // Format date properly for backend
      const formattedDate = form.dateOfBirth.includes('T') 
        ? form.dateOfBirth.split('T')[0] 
        : form.dateOfBirth;

      const kycData = {
        // Personal Information
        dateOfBirth: formattedDate,
        gender: form.gender,
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
        taxId: form.taxId,
        
        // Employment & Financial Information
        employmentStatus: form.employmentStatus,
        employerName: form.employerName,
        jobTitle: form.jobTitle,
        annualIncome: form.annualIncome,
        netWorth: form.netWorth,
        liquidNetWorth: form.liquidNetWorth,
        investmentExperience: form.investmentExperience,
        investmentObjectives: form.investmentObjectives,
        riskTolerance: form.riskTolerance,
        investmentTimeHorizon: form.investmentTimeHorizon,
        
        // Compliance & Legal
        isPoliticallyExposedPerson: form.isPoliticallyExposedPerson,
        hasRegulatoryRestrictions: form.hasRegulatoryRestrictions,
        hasFelonyConviction: form.hasFelonyConviction,
        hasRegulatoryAction: form.hasRegulatoryAction,
        sourceOfFunds: form.sourceOfFunds,
        expectedAnnualTradingVolume: form.expectedAnnualTradingVolume,
        expectedMaxPositionSize: form.expectedMaxPositionSize,
        
        // Documentation
        idDocumentType: form.idDocumentType,
        idDocumentNumber: form.idDocumentNumber,
        idDocumentExpiryDate: form.idDocumentExpiryDate,
        idDocumentIssuingCountry: getCountryCode(form.idDocumentIssuingCountry),
        proofOfAddressDocumentType: form.proofOfAddressDocumentType,
        proofOfAddressDocumentNumber: form.proofOfAddressDocumentNumber,
        proofOfAddressDocumentIssueDate: form.proofOfAddressDocumentIssueDate,
        
        // Additional Information
        additionalComments: form.additionalComments,
        agreeToElectronicCommunications: form.agreeToElectronicCommunications,
        agreeToTerms: form.agreeToTerms,
        agreeToPrivacyPolicy: form.agreeToPrivacyPolicy,
      };

      const response = await axiosInstance.post('/user/kyc', kycData);
      
      Toast.show({
        type: 'success',
        text1: 'KYC submitted successfully!',
        text2: 'Your information is under review.',
      });

      // Navigate back to account or main app
      router.replace('/tabs/account');
    } catch (error: any) {
      console.error('KYC submission failed:', error);
      const errorMessage = error.response?.data?.message || 'KYC submission failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.helpText}>Please provide your personal details</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        placeholderTextColor="#888"
        value={form.dateOfBirth}
        onChangeText={(value) => updateForm('dateOfBirth', value)}
        keyboardType="numeric"
        maxLength={10}
      />

      <View style={styles.rowContainer}>
        <Text style={styles.label}>Gender:</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => updateForm('gender', 1)}
          >
            {form.gender === 1 && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
            {form.gender !== 1 && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
            <Text style={styles.radioText}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => updateForm('gender', 2)}
          >
            {form.gender === 2 && <MaterialIcons name="radio-button-checked" size={20} color="#2E8B57" />}
            {form.gender !== 2 && <MaterialIcons name="radio-button-unchecked" size={20} color="#888" />}
            <Text style={styles.radioText}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Address & Citizenship Information</Text>
      <Text style={styles.helpText}>Please provide your residential address and citizenship details</Text>
      
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

      <TextInput
        style={styles.input}
        placeholder="Postal Code"
        placeholderTextColor="#888"
        value={form.postalCode}
        onChangeText={(value) => updateForm('postalCode', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Country"
        placeholderTextColor="#888"
        value={form.country}
        onChangeText={(value) => updateForm('country', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Country of Residence"
        placeholderTextColor="#888"
        value={form.countryOfResidence}
        onChangeText={(value) => updateForm('countryOfResidence', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Citizenship"
        placeholderTextColor="#888"
        value={form.citizenship}
        onChangeText={(value) => updateForm('citizenship', value)}
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Document & Financial Information</Text>
      <Text style={styles.helpText}>Please provide your document details and financial information</Text>
      
      <Text style={styles.sectionTitle}>Identity Documents</Text>
      
      <TextInput
        style={styles.input}
        placeholder="ID Document Type (e.g., Passport, Driver's License)"
        placeholderTextColor="#888"
        value={form.idDocumentType}
        onChangeText={(value) => updateForm('idDocumentType', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="ID Document Number"
        placeholderTextColor="#888"
        value={form.idDocumentNumber}
        onChangeText={(value) => updateForm('idDocumentNumber', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="ID Document Expiry Date (YYYY-MM-DD)"
        placeholderTextColor="#888"
        value={form.idDocumentExpiryDate}
        onChangeText={(value) => updateForm('idDocumentExpiryDate', value)}
        keyboardType="numeric"
        maxLength={10}
      />

      <TextInput
        style={styles.input}
        placeholder="ID Document Issuing Country"
        placeholderTextColor="#888"
        value={form.idDocumentIssuingCountry}
        onChangeText={(value) => updateForm('idDocumentIssuingCountry', value)}
      />

      <Text style={styles.sectionTitle}>Proof of Address</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Proof of Address Document Type"
        placeholderTextColor="#888"
        value={form.proofOfAddressDocumentType}
        onChangeText={(value) => updateForm('proofOfAddressDocumentType', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Proof of Address Document Number"
        placeholderTextColor="#888"
        value={form.proofOfAddressDocumentNumber}
        onChangeText={(value) => updateForm('proofOfAddressDocumentNumber', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Proof of Address Issue Date (YYYY-MM-DD)"
        placeholderTextColor="#888"
        value={form.proofOfAddressDocumentIssueDate}
        onChangeText={(value) => updateForm('proofOfAddressDocumentIssueDate', value)}
        keyboardType="numeric"
        maxLength={10}
      />

      <Text style={styles.sectionTitle}>Financial Information</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Tax ID / SSN"
        placeholderTextColor="#888"
        value={form.taxId}
        onChangeText={(value) => updateForm('taxId', value)}
        secureTextEntry
      />

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

      <TextInput
        style={styles.input}
        placeholder="Source of Funds"
        placeholderTextColor="#888"
        value={form.sourceOfFunds}
        onChangeText={(value) => updateForm('sourceOfFunds', value)}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.disclaimerText}>
        This information is required for compliance and risk assessment. 
        Your data is secure and encrypted.
      </Text>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Additional Information & Agreements</Text>
      <Text style={styles.helpText}>Please provide additional information and agree to terms</Text>
      
      <Text style={styles.sectionTitle}>Trading Information</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Expected Annual Trading Volume ($)"
        placeholderTextColor="#888"
        value={form.expectedAnnualTradingVolume.toString()}
        onChangeText={(value) => updateForm('expectedAnnualTradingVolume', parseFloat(value) || 0)}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Expected Maximum Position Size ($)"
        placeholderTextColor="#888"
        value={form.expectedMaxPositionSize.toString()}
        onChangeText={(value) => updateForm('expectedMaxPositionSize', parseFloat(value) || 0)}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Additional Comments"
        placeholderTextColor="#888"
        value={form.additionalComments}
        onChangeText={(value) => updateForm('additionalComments', value)}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.sectionTitle}>Legal Agreements</Text>
      
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

      <Text style={styles.disclaimerText}>
        By submitting this KYC form, you acknowledge that all information provided is accurate and complete.
        Trading involves risk and you may lose money.
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

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
              <Text style={styles.buttonText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentStep < totalSteps ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.nextButton, loading && styles.disabledButton]} 
              onPress={handleKycSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Submit KYC</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default KycScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  logo: {
    width: 120,
    height: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E8B57',
    borderRadius: 2,
  },
  progressText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 12,
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
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    color: '#FFF',
    marginRight: 16,
    minWidth: 80,
  },
  radioContainer: {
    flexDirection: 'row',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  previousButton: {
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.4,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.4,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  disclaimerText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
