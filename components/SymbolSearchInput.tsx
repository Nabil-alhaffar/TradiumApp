import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { debounce } from 'lodash';
import axiosInstance from '../app/services/AxiosInstance';
import { Portal } from 'react-native-paper';

export interface StockSuggestion {
  symbol: string;
  name: string;
  assetClass: string;
  exchange: string;
}

interface SymbolSearchInputProps {
  value: string;
  onChange: (text: string) => void;
  onSelect: (suggestion: StockSuggestion) => void;
  placeholder?: string;
  style?: any;
}

const SymbolSearchInput: React.FC<SymbolSearchInputProps> = ({ value, onChange, onSelect, placeholder, style }) => {
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<any>(null);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 1) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await axiosInstance.get<StockSuggestion[]>('/alpaca/search', {
          params: { q: query }
        });
        setSuggestions(response.data);
      } catch (err) {
        setSuggestions([]);
      }
    }, 300),
    []
  );

  const handleChange = (text: string) => {
    onChange(text);
    debouncedSearch(text);
    setShowSuggestions(true);
  };

  const handleSelect = (suggestion: StockSuggestion) => {
    onChange(suggestion.symbol);
    onSelect(suggestion);
    setShowSuggestions(false);
  };

  return (
    <View style={[{ position: 'relative' }, style]}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder || 'Search by symbol or company name'}
        placeholderTextColor="#999"
        value={value}
        onChangeText={handleChange}
        autoCapitalize="characters"
        onFocus={() => setShowSuggestions(true)}
      />
      <Portal>
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.symbol}
                  style={styles.suggestionItem}
                  onPress={() => handleSelect(suggestion)}
                >
                  <View style={styles.suggestionMain}>
                    <Text style={styles.symbolText}>{suggestion.symbol}</Text>
                    <Text style={styles.assetClassText}>
                      ({suggestion.assetClass.replace(/-/g, ' ').toUpperCase()})
                    </Text>
                    <Text style={styles.exchangeText}>{suggestion.exchange}</Text>
                  </View>
                  <Text style={styles.nameText} numberOfLines={1}>{suggestion.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 44,
    left: 0,
    width: 360,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 3000,
    maxHeight: 300,
    alignSelf: 'center',
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  suggestionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  symbolText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  assetClassText: {
    color: '#AAA',
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 6,
  },
  exchangeText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 6,
  },
  nameText: {
    color: '#AAA',
    fontSize: 13,
    marginTop: 2,
  },
});

export default SymbolSearchInput; 