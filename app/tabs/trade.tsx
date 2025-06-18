import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  TouchableWithoutFeedback,
  findNodeHandle,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import StockChart from '../../components/StockChart/StockChart';
import axiosInstance from '../services/AxiosInstance';
import { format, parseISO } from 'date-fns';
import { debounce } from 'lodash';
import { Portal, Provider as PaperProvider } from 'react-native-paper';
import FloatingTradePanel from '../../components/FloatingTradePanel';

interface FinnhubProfile {
  name: string;
  ticker: string;
  exchange: string;
  weburl: string;
  logo: string;
  country: string;
  ipo: string;
  finnhubIndustry: string;
  currency: string;
  marketCapitalization: number;
  shareOutstanding: number;
}

interface FinnhubQuote {
  c: number;  // Current price
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

interface FinnhubMetrics {
  metric: {
    // Price Returns
    '5DayPriceReturnDaily': number;
    '13WeekPriceReturnDaily': number;
    '26WeekPriceReturnDaily': number;
    '52WeekPriceReturnDaily': number;
    'yearToDatePriceReturnDaily': number;
    'monthToDatePriceReturnDaily': number;

    // Trading Volume
    '10DayAverageTradingVolume': number;
    '3MonthAverageTradingVolume': number;

    // Valuation Metrics
    'peAnnual': number;
    'peTTM': number;
    'pbAnnual': number;
    'psAnnual': number;
    'psTTM': number;

    // Growth Metrics
    'revenueGrowth3Y': number;
    'revenueGrowth5Y': number;
    'revenueGrowthQuarterlyYoy': number;
    'epsGrowth3Y': number;
    'epsGrowth5Y': number;
    'epsGrowthQuarterlyYoy': number;

    // Profitability
    'grossMarginAnnual': number;
    'grossMarginTTM': number;
    'operatingMarginAnnual': number;
    'operatingMarginTTM': number;
    'netProfitMarginAnnual': number;
    'netProfitMarginTTM': number;

    // Returns
    'roaRfy': number;
    'roaTTM': number;
    'roeRfy': number;
    'roeTTM': number;
    'roiAnnual': number;
    'roiTTM': number;

    // Financial Health
    'currentRatioAnnual': number;
    'currentRatioQuarterly': number;
    'quickRatioAnnual': number;
    'quickRatioQuarterly': number;
    'totalDebt/totalEquityAnnual': number;
    'totalDebt/totalEquityQuarterly': number;

    // Per Share Metrics
    'bookValuePerShareAnnual': number;
    'cashFlowPerShareTTM': number;
    'epsAnnual': number;
    'epsTTM': number;
    'revenuePerShareAnnual': number;
    'revenuePerShareTTM': number;

    // Additional fields from the response
    '52WeekHigh': number;
    '52WeekLow': number;
    '52WeekHighDate': string;
    '52WeekLowDate': string;
    'eps': number;
  }
}

interface Stock {
  symbol: string;
  companyName: string;
  currentPrice: number;
  country: string;
  marketValue: number;
  high52Week: number;
  low52Week: number;
  eps: number;
  stockSector: string;
  exchange: string;
  description: string;
  logoURL: string;
  officialSite: string;
  quote: {
    symbol: string;
    high: number;
    low: number;
    lastPrice: number;
    volume: number;
    previousClose: number;
    change: number;
    changePercent: number;
  };
}

interface Position {
  symbol: string;
  quantity: number;
  positionRatio: number;
  type: string;
  averagePurchasePrice: number;
  totalCost: number;
  marketValue: number;
}

interface NewsItem {
  id: number;
  author: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  content: string;
  createdAt: string;
  symbols: string[];
}

interface NewsResponse {
  news: NewsItem[];
}

interface EarningsCalendarItem {
  symbol: string;
  date: string;
  hour: string;
  epsEstimate: number;
  epsActual: number | null;
  revenueEstimate: number;
  revenueActual: number | null;
  quarter: number;
}

interface EarningsResponse {
  earningsCalendar: EarningsCalendarItem[];
}

interface AnalystRecommendation {
  symbol: string;
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

interface StockSuggestion {
  symbol: string;
  name: string;
  assetClass: string;
  exchange: string;
}

const orderTypes = ['Buy', 'Sell', 'Short', 'CloseShort'];

type MetricCategory = {
  key: keyof FinnhubMetrics['metric'];
  label: string;
}

type MetricCategories = {
  [key: string]: MetricCategory[];
}

const metricCategories: MetricCategories = {
  'Price Returns': [
    { key: '5DayPriceReturnDaily', label: '5 Day Return' },
    { key: '13WeekPriceReturnDaily', label: '13 Week Return' },
    { key: '26WeekPriceReturnDaily', label: '26 Week Return' },
    { key: '52WeekPriceReturnDaily', label: '52 Week Return' },
    { key: 'yearToDatePriceReturnDaily', label: 'YTD Return' },
    { key: 'monthToDatePriceReturnDaily', label: 'MTD Return' },
  ],
  'Valuation': [
    { key: 'peAnnual', label: 'P/E (Annual)' },
    { key: 'peTTM', label: 'P/E (TTM)' },
    { key: 'pbAnnual', label: 'P/B (Annual)' },
    { key: 'psAnnual', label: 'P/S (Annual)' },
    { key: 'psTTM', label: 'P/S (TTM)' },
  ],
  'Growth': [
    { key: 'revenueGrowth3Y', label: 'Revenue Growth (3Y)' },
    { key: 'revenueGrowth5Y', label: 'Revenue Growth (5Y)' },
    { key: 'epsGrowth3Y', label: 'EPS Growth (3Y)' },
    { key: 'epsGrowth5Y', label: 'EPS Growth (5Y)' },
  ],
  'Profitability': [
    { key: 'grossMarginTTM', label: 'Gross Margin (TTM)' },
    { key: 'operatingMarginTTM', label: 'Operating Margin (TTM)' },
    { key: 'netProfitMarginTTM', label: 'Net Profit Margin (TTM)' },
  ],
  'Returns': [
    { key: 'roaTTM', label: 'ROA (TTM)' },
    { key: 'roeTTM', label: 'ROE (TTM)' },
    { key: 'roiTTM', label: 'ROI (TTM)' },
  ],
  'Financial Health': [
    { key: 'currentRatioQuarterly', label: 'Current Ratio' },
    { key: 'quickRatioQuarterly', label: 'Quick Ratio' },
    { key: 'totalDebt/totalEquityQuarterly', label: 'Debt/Equity' },
  ],
};

const formatCurrency = (value: number) => {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
};

const getMarketHour = (hour: string) => {
  switch (hour) {
    case 'bmo':
      return 'Before Market Open';
    case 'amc':
      return 'After Market Close';
    case 'dmh':
      return 'During Market Hours';
    default:
      return 'Time Not Specified';
  }
};

const TradeScreen = () => {
  const [error, setError] = useState<string | null>(null);
  const [searchedSymbol, setSearchedSymbol] = useState('');
  const [stock, setStock] = useState<Stock | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isExistingPosition, setIsExistingPosition] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Price Returns');
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [financials, setFinancials] = useState<FinnhubMetrics | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isNewsExpanded, setIsNewsExpanded] = useState(false);
  const [earnings, setEarnings] = useState<EarningsCalendarItem[]>([]);
  const [recommendations, setRecommendations] = useState<AnalystRecommendation[]>([]);
  const [isEarningsExpanded, setIsEarningsExpanded] = useState(false);
  const [isRecommendationsExpanded, setIsRecommendationsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputLayout, setInputLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const searchContainerRef = useRef<View>(null);

  const debouncedSearch = React.useCallback(
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
        console.error('Error fetching suggestions:', err);
      }
    }, 300),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setSearchedSymbol(text);
    debouncedSearch(text);
    setShowSuggestions(true);
  };

  const handleSuggestionPress = (suggestion: StockSuggestion) => {
    setSearchQuery(suggestion.symbol);
    setSearchedSymbol(suggestion.symbol);
    setShowSuggestions(false);
    fetchStock();
  };

  const measureInputPosition = () => {
    if (searchContainerRef.current) {
      const handle = findNodeHandle(searchContainerRef.current);
      if (handle) {
        searchContainerRef.current.measure((_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
          setInputLayout({
            x: pageX,
            y: pageY,
            width,
            height
          });
        });
      }
    }
  };

  useEffect(() => {
    const getToken = async () => {
      const storedToken = Platform.OS === 'web'
        ? await AsyncStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');
      setToken(storedToken);
    };
    const getUserId = async ()=> {
        const storedUserId = Platform.OS === 'web'
        ? await AsyncStorage.getItem('userId')
        : await SecureStore.getItemAsync('userId');
        setUserId (storedUserId);
    }
    getToken();
    getUserId();
  }, []);

  const fetchStock = async () => {
    try {
      const [profileResponse, quoteResponse, financialsResponse, newsResponse, earningsResponse, recommendationsResponse] = await Promise.all([
        axiosInstance.get<FinnhubProfile>(`/finnhub/profile/${searchedSymbol}`),
        axiosInstance.get<FinnhubQuote>(`/finnhub/quote/${searchedSymbol}`),
        axiosInstance.get<FinnhubMetrics>(`/finnhub/basic-financials/${searchedSymbol}`),
        axiosInstance.get<NewsResponse>(`/alpaca/${searchedSymbol}/news`, {
          params: { limit: 10 }
        }),
        axiosInstance.get<EarningsResponse>(`/finnhub/earnings/${searchedSymbol}`),
        axiosInstance.get<AnalystRecommendation[]>(`/finnhub/recommendations/${searchedSymbol}`)
      ]);

      const profile = profileResponse.data;
      const quote = quoteResponse.data;
      setFinancials(financialsResponse.data);
      setNews(newsResponse.data.news);
      setEarnings(earningsResponse.data.earningsCalendar);
      setRecommendations(recommendationsResponse.data);

      // Calculate change and change percent
      const change = quote.c - quote.pc;
      const changePercent = (change / quote.pc) * 100;

      setStock({
        symbol: profile.ticker || searchedSymbol,
        companyName: profile.name,
        currentPrice: quote.c,
        country: profile.country,
        marketValue: profile.marketCapitalization * 1000000,
        high52Week: financialsResponse.data.metric['52WeekHigh'],
        low52Week: financialsResponse.data.metric['52WeekLow'],
        eps: financialsResponse.data.metric.eps || 0,
        stockSector: profile.finnhubIndustry,
        exchange: profile.exchange,
        description: `${profile.name} is a ${profile.finnhubIndustry} company listed on ${profile.exchange}. IPO Date: ${profile.ipo}`,
        logoURL: profile.logo,
        officialSite: profile.weburl,
        quote: {
          symbol: profile.ticker,
          high: quote.h,
          low: quote.l,
          lastPrice: quote.c,
          volume: 0,
          previousClose: quote.pc,
          change: change,
          changePercent: changePercent
        }
      });

      fetchExistingPosition();
      setError(null);
    } catch (err) {
      console.error('Error fetching stock:', err);
      setError('Stock not found or network issue.');
    }
  };

  const handleTrade = async (type: string, quantity: string) => {
    if (!token || !stock) return;

    try {
      const response = await axiosInstance.post('/Stock/execute-trade', {
        symbol: stock.symbol,
        quantity: parseInt(quantity),
        side: type,
      });

      Toast.show({
        type: 'success',
        text1: `${type} order placed.`,
        text2: `${response.data.message}`,
      });

      await fetchExistingPosition();
    } catch (err: any) {
      console.error('Trade error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'An unexpected error occurred.';
      Toast.show({
        type: 'error',
        text1: 'Failed to execute trade.',
        text2: `${errorMessage}`,
      });
    }
  };

  const fetchExistingPosition = async () => {
    console.log("fetching position");
  
    try {
      const response = await axiosInstance.get(`/Portfolio/Positions/${userId}/${searchedSymbol}`, 
      );
  
      if (response.data) {
        setPosition(response.data);
        setIsExistingPosition(true);
      } else {
        setPosition(null);
        setIsExistingPosition(false);
      }
    } catch (err) {
      console.error("Error fetching position ", err);
      setPosition(null);
      setIsExistingPosition(false);
    }
  };
  
  return (
    <PaperProvider>
      <View style={{ flex: 1, position: 'relative' }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
          <View 
            ref={searchContainerRef}
            style={styles.lookUpInterface}
            onLayout={measureInputPosition}
          >
            <TextInput
              style={styles.inputField}
              onChangeText={handleSearchChange}
              placeholder="Search by symbol or company name"
              placeholderTextColor="#aaa"
              value={searchQuery}
              onFocus={() => {
                setShowSuggestions(true);
                measureInputPosition();
              }}
            />
            <TouchableOpacity style={styles.lookUpButton} onPress={fetchStock}>
              <IconSymbol size={28} name="magnifyingglass" color="#000" />
            </TouchableOpacity>
          </View>

          <Portal>
            {showSuggestions && suggestions.length > 0 && (
              <TouchableWithoutFeedback onPress={() => setShowSuggestions(false)}>
                <View style={StyleSheet.absoluteFill}>
                  <View 
                    style={[
                      styles.suggestionsContainer,
                      {
                        position: 'absolute',
                        top: inputLayout.y + inputLayout.height + 4,
                        left: inputLayout.x,
                        width: inputLayout.width,
                      }
                    ]}
                  >
                    <ScrollView 
                      style={styles.suggestionsList} 
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                    >
                      {suggestions.map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion.symbol}
                          style={styles.suggestionItem}
                          onPress={() => handleSuggestionPress(suggestion)}
                        >
                          <View style={styles.suggestionContent}>
                            <View style={styles.suggestionMain}>
                              <Text style={styles.symbolText}>{suggestion.symbol}</Text>
                              <Text style={styles.exchangeText}>{suggestion.exchange}</Text>
                            </View>
                            <Text style={styles.nameText} numberOfLines={1}>
                              {suggestion.name}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            )}
          </Portal>

          {stock && (
            <>
              {/* Stock Info Card */}
              <View style={styles.stockCard}>
                {stock.logoURL && (
                  <Image
                    source={{ uri: stock.logoURL }}
                    style={{ width: 100, height: 100, marginTop: 10, marginBottom: 50, alignSelf: 'center' }}
                    resizeMode="contain"
                  />
                )}
                {Object.entries({
                  Symbol: stock.symbol,
                  Company: stock.companyName,
                  'Current Price': `$${stock.currentPrice.toFixed(2)}`,
                  Country: stock.country,
                  'Market Value': stock.marketValue ? `$${stock.marketValue.toLocaleString()}` : 'N/A',
                  '52 Week High': `$${stock.high52Week.toFixed(2)}`,
                  '52 Week Low': `$${stock.low52Week.toFixed(2)}`,
                  EPS: stock.eps.toFixed(2),
                  Sector: stock.stockSector,
                  Exchange: stock.exchange,
                  'Official Site': stock.officialSite,
                }).reduce((rows, entry, index) => {
                  const rowIndex = Math.floor(index / 3);
                  if (!rows[rowIndex]) rows[rowIndex] = [];
                  rows[rowIndex].push(entry);
                  return rows;
                }, [] as [string, any][][]).map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.cardRowMulti}>
                    {row.map(([label, value]) => (
                      <View key={label} style={{ flex: 1 }}>
                        <Text style={styles.cardLabel}>{label}</Text>
                        <Text style={styles.cardValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                ))}

                <Text style={styles.stockDescription}>{stock.description}</Text>
              </View>

              {/* Financial Metrics Dropdown */}
              <View style={styles.metricsContainer}>
                <TouchableOpacity
                  style={styles.metricsHeader}
                  onPress={() => setIsMetricsExpanded(!isMetricsExpanded)}
                >
                  <Text style={styles.metricsHeaderText}>Financial Metrics</Text>
                  <Text style={styles.expandIcon}>{isMetricsExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {isMetricsExpanded && (
                  <View style={styles.metricsContent}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                      {Object.keys(metricCategories).map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryTab,
                            selectedCategory === category && styles.selectedCategoryTab,
                          ]}
                          onPress={() => setSelectedCategory(category)}
                        >
                          <Text style={[
                            styles.categoryTabText,
                            selectedCategory === category && styles.selectedCategoryTabText,
                          ]}>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={styles.metricsGrid}>
                      {financials && metricCategories[selectedCategory]?.map(({ key, label }) => {
                        const value = financials.metric[key];
                        const isPercentage = key.toLowerCase().includes('margin') || key.toLowerCase().includes('return');
                        return (
                          <View key={key} style={styles.metricItem}>
                            <Text style={styles.metricLabel}>{label}</Text>
                            <Text style={styles.metricValue}>
                              {typeof value === 'number' ? value.toFixed(2) : value}
                              {isPercentage ? '%' : ''}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* News Section */}
              <View style={styles.newsContainer}>
                <TouchableOpacity
                  style={styles.newsHeader}
                  onPress={() => setIsNewsExpanded(!isNewsExpanded)}
                >
                  <Text style={styles.newsHeaderText}>Latest News</Text>
                  <Text style={styles.expandIcon}>{isNewsExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {isNewsExpanded && (
                  <View style={styles.newsContent}>
                    <ScrollView style={styles.newsList}>
                      {news.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.newsItem}
                          onPress={() => {
                            if (Platform.OS === 'web') {
                              window.open(item.url, '_blank');
                            }
                          }}
                        >
                          <View style={styles.newsItemHeader}>
                            <Text style={styles.newsSource}>{item.source}</Text>
                            <Text style={styles.newsAuthor}>{item.author}</Text>
                          </View>
                          <Text style={styles.newsHeadline}>{item.headline}</Text>
                          <Text style={styles.newsSummary} numberOfLines={2}>
                            {item.summary}
                          </Text>
                          <View style={styles.newsSymbols}>
                            {item.symbols.map((symbol) => (
                              <View key={symbol} style={styles.symbolTag}>
                                <Text style={styles.symbolTagText}>{symbol}</Text>
                              </View>
                            ))}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Earnings Calendar Section */}
              <View style={styles.earningsContainer}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setIsEarningsExpanded(!isEarningsExpanded)}
                >
                  <Text style={styles.sectionHeaderText}>Earnings Calendar</Text>
                  <Text style={styles.expandIcon}>{isEarningsExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {isEarningsExpanded && (
                  <View style={styles.earningsContent}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {earnings.map((earning) => (
                        <View key={`${earning.date}-${earning.quarter}`} style={styles.earningCard}>
                          <Text style={styles.earningDate}>
                            {format(parseISO(earning.date), 'MMM d, yyyy')}
                          </Text>
                          <Text style={styles.earningHour}>{getMarketHour(earning.hour)}</Text>
                          <Text style={styles.earningQuarter}>Q{earning.quarter}</Text>
                          <View style={styles.earningMetric}>
                            <Text style={styles.metricLabel}>EPS Est.</Text>
                            <Text style={styles.metricValue}>${earning.epsEstimate.toFixed(2)}</Text>
                            {earning.epsActual && (
                              <Text style={[
                                styles.metricActual,
                                { color: earning.epsActual >= earning.epsEstimate ? '#4CAF50' : '#FF5252' }
                              ]}>
                                Actual: ${earning.epsActual.toFixed(2)}
                              </Text>
                            )}
                          </View>
                          <View style={styles.earningMetric}>
                            <Text style={styles.metricLabel}>Revenue Est.</Text>
                            <Text style={styles.metricValue}>{formatCurrency(earning.revenueEstimate)}</Text>
                            {earning.revenueActual && (
                              <Text style={[
                                styles.metricActual,
                                { color: earning.revenueActual >= earning.revenueEstimate ? '#4CAF50' : '#FF5252' }
                              ]}>
                                Actual: {formatCurrency(earning.revenueActual)}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Analyst Recommendations Section */}
              <View style={styles.recommendationsContainer}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setIsRecommendationsExpanded(!isRecommendationsExpanded)}
                >
                  <Text style={styles.sectionHeaderText}>Analyst Recommendations</Text>
                  <Text style={styles.expandIcon}>{isRecommendationsExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {isRecommendationsExpanded && recommendations.length > 0 && (
                  <View style={styles.recommendationsContent}>
                    <View style={styles.latestRecommendation}>
                      {(() => {
                        const latest = recommendations[0];
                        const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
                        return (
                          <>
                            <Text style={styles.recommendationPeriod}>
                              {format(parseISO(latest.period), 'MMMM yyyy')}
                            </Text>
                            <View style={styles.recommendationBar}>
                              <View style={[styles.barSegment, { backgroundColor: '#00C853', width: `${(latest.strongBuy / total) * 100}%` }]}>
                                <Text style={styles.barText}>{latest.strongBuy}</Text>
                              </View>
                              <View style={[styles.barSegment, { backgroundColor: '#4CAF50', width: `${(latest.buy / total) * 100}%` }]}>
                                <Text style={styles.barText}>{latest.buy}</Text>
                              </View>
                              <View style={[styles.barSegment, { backgroundColor: '#FFD740', width: `${(latest.hold / total) * 100}%` }]}>
                                <Text style={styles.barText}>{latest.hold}</Text>
                              </View>
                              <View style={[styles.barSegment, { backgroundColor: '#FF5252', width: `${(latest.sell / total) * 100}%` }]}>
                                <Text style={styles.barText}>{latest.sell}</Text>
                              </View>
                              <View style={[styles.barSegment, { backgroundColor: '#D50000', width: `${(latest.strongSell / total) * 100}%` }]}>
                                <Text style={styles.barText}>{latest.strongSell}</Text>
                              </View>
                            </View>
                            <View style={styles.recommendationLegend}>
                              <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: '#00C853' }]} />
                                <Text style={styles.legendText}>Strong Buy</Text>
                              </View>
                              <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                                <Text style={styles.legendText}>Buy</Text>
                              </View>
                              <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: '#FFD740' }]} />
                                <Text style={styles.legendText}>Hold</Text>
                              </View>
                              <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: '#FF5252' }]} />
                                <Text style={styles.legendText}>Sell</Text>
                              </View>
                              <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: '#D50000' }]} />
                                <Text style={styles.legendText}>Strong Sell</Text>
                              </View>
                            </View>
                          </>
                        );
                      })()}
                    </View>
                  </View>
                )}
              </View>

              <View>
                <View style={styles.chartContainer}>
                  <StockChart
                    symbol={stock.symbol}
                    timeframe="1min"
                    chartType="candlestick"
                  />
                </View>
              </View>

              {/* Quote Card */}
              <View style={styles.stockCard}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, outlineColor: '#FFF', borderColor: '#FFF' }}>Quote Data</Text>
                {Object.entries({
                  High: `$${stock.quote.high.toFixed(2)}`,
                  Low: `$${stock.quote.low.toFixed(2)}`,
                  'Last Price': `$${stock.quote.lastPrice.toFixed(2)}`,
                  'Previous Close': `$${stock.quote.previousClose.toFixed(2)}`,
                  Change: `$${stock.quote.change.toFixed(2)}`,
                  'Change Percent': `${stock.quote.changePercent.toFixed(2)}%`,
                }).reduce((rows, entry, index) => {
                  const rowIndex = Math.floor(index / 3);
                  if (!rows[rowIndex]) rows[rowIndex] = [];
                  rows[rowIndex].push(entry);
                  return rows;
                }, [] as [string, any][][]).map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.cardRowMulti}>
                    {row.map(([label, value]) => (
                      <View key={label} style={{ flex: 1 }}>
                        <Text style={styles.cardLabel}>{label}</Text>
                        <Text style={styles.cardValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              {position && (
                        <>
                    <View style = {styles.positionCard}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Current Position</Text>

                        {Object.entries({
                            Quantity: position?.quantity, 
                            'Position Ratio': `${position?.positionRatio}%` , 
                            'Position Type': position?.type,
                            'Average Price Per Share ': `$${position?.averagePurchasePrice}`, 
                            Cost: `$${position?.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`, 
                            'Market Value': `$${position?.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`,

                        }).reduce((rows, entry, index) => {
                            const rowIndex = Math.floor(index / 3);
                            if (!rows[rowIndex]) rows[rowIndex] = [];
                            rows[rowIndex].push(entry);
                            return rows;
                        }, [] as [string, any][][]).map((row, rowIndex) => (
                            <View key={rowIndex} style={styles.cardRowMulti}>
                            {row.map(([label, value]) => (
                                <View key={label} style={{ flex: 1 }}>
                                <Text style={styles.cardLabel}>{label}</Text>
                                <Text style={styles.cardValue}>{value}</Text>
                                </View>
                            ))}
                            </View>
                        ))}  


                    </View>
                        </>
                    )}

            </>
          )}

          {error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}
        </ScrollView>

        {stock && (
          <FloatingTradePanel
            symbol={stock.symbol}
            currentPrice={stock.currentPrice}
            onTrade={handleTrade}
            userId={userId}
          />
        )}
      </View>
    </PaperProvider>
  );
};

export default TradeScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: '#121212',
  },
  lookUpInterface: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
    minWidth: 600,
    alignSelf: 'center'
  },
  inputField: {
    borderRadius: 12,
    textAlign: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#555',
    padding: 12,
    color: '#FFF',
    minWidth: 100,
    alignSelf: 'center',
    backgroundColor: '#1E1E1E',
    zIndex: 1000,
  },
  lookUpButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 10,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  positionCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  cardRowMulti: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 12,
    color: '#AAA',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  stockDescription: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  suggestionsWrapper: {
    paddingHorizontal: 16,
    paddingTop: 120,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  suggestionsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 300,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  suggestionContent: {
    gap: 4,
  },
  suggestionMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  symbolText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exchangeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  nameText: {
    color: '#AAA',
    fontSize: 14,
  },
  metricsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  metricsHeaderText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandIcon: {
    color: '#FFF',
    fontSize: 14,
  },
  metricsContent: {
    padding: 16,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
  },
  selectedCategoryTab: {
    backgroundColor: '#4CAF50',
  },
  categoryTabText: {
    color: '#AAA',
    fontSize: 14,
  },
  selectedCategoryTabText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  metricLabel: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  newsHeaderText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newsContent: {
    maxHeight: 500,
  },
  newsList: {
    padding: 16,
  },
  newsItem: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  newsItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  newsSource: {
    color: '#4CAF50',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  newsAuthor: {
    color: '#AAA',
    fontSize: 12,
  },
  newsHeadline: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  newsSummary: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  newsSymbols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symbolTag: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  symbolTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionHeaderText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  earningsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  earningsContent: {
    padding: 16,
  },
  earningCard: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
    width: 280,
  },
  earningDate: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  earningHour: {
    color: '#4CAF50',
    fontSize: 12,
    marginBottom: 8,
  },
  earningQuarter: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 12,
  },
  earningMetric: {
    marginBottom: 12,
  },
  metricActual: {
    fontSize: 14,
    marginTop: 4,
  },
  recommendationsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  recommendationsContent: {
    padding: 16,
  },
  latestRecommendation: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 8,
  },
  recommendationPeriod: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recommendationBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  barSegment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  barText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendationLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    color: '#AAA',
    fontSize: 12,
  },
  chartContainer: {
    overflowX:'hidden',
    flex: 1,
    
    maxHeight: 900,  // increased minimum height
    minHeight:600,
    // maxWidth: 100,
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginVertical: 10,
  },
});
