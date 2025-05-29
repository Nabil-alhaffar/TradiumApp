

// components/StockChart/StockChart.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Dimensions, Text, TouchableOpacity } from 'react-native';
import {
  CandlestickChart,
  CandlestickChartProvider,
  LineChart,
  LineChartProvider,
} from 'react-native-wagmi-charts';
import axios from 'axios';
import * as haptics from 'expo-haptics';

import { connectToMarketData, joinSymbolGroup, disconnect } from '../../app/services/SignalRService';
import { parseBar, parseBars, Bar } from './chartParsers';
import { ScrollView } from 'react-native-gesture-handler';

interface StockChartProps {
  symbol: string;
  timeframe: string;
  chartType: 'candlestick' | 'line';
}

const screenHeight = Dimensions.get('window').height;

const StockChart: React.FC<StockChartProps> = ({ symbol, timeframe, chartType }) => {
  const [data, setData] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 75 }); // Show first 20 items by default

  function invokeHaptic() {
    haptics.impactAsync(haptics.ImpactFeedbackStyle.Light);
  }
  
  const handleZoom = (factor: number) => {
    const newRangeSize = Math.max(
      25, // Minimum 5 items visible
      Math.min(
        data.length, // Maximum all items visible
        Math.floor((visibleRange.end - visibleRange.start) * factor)
      )
    );
    
    setVisibleRange({
      start: Math.max(0, data.length - newRangeSize),
      end: data.length
    });
  };
  // Fetch historical data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/api/alpaca/${symbol}/historicaldata/${timeframe}`;
        const response = await axios.get(url);

        let bars = response.data.bars.bars;
        if (typeof bars === 'string') bars = JSON.parse(bars);
        if (!Array.isArray(bars)) throw new Error('Expected bars to be an array');

        setData(parseBars(bars));
      } catch (err) {
        console.error('Historical data fetch error:', err);
        setError('Failed to load chart data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe]);

  // Real-time updates
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const onBar = (bar: any) => {
      const parsed = parseBar(bar);
      setData((prev) => {
        const filtered = prev.filter((item) => item.timestamp !== parsed.timestamp);
        return [...filtered.slice(-99), parsed];
      });
    };

    connectToMarketData(() => {}, () => {}, onBar).then(() => joinSymbolGroup(symbol));

    return () => {
      disconnect(); // Optionally disconnect specific group if supported
    };
  }, [symbol]);

  if (loading || data.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }
 

  const renderChart = () => {
    if (chartType === 'candlestick') {
      const visibleData = data.slice(visibleRange.start, visibleRange.end);
      // const minY = Math.min(...visibleData.map((candle) => candle.low));
      // const maxY = Math.max(...visibleData.map((candle) => candle.high));
      const generateXTicks = (data:any) => {
        if (!data || data.length === 0) return [];
      
        const interval = Math.floor(data.length / 4); // 4 labels
        const ticks = [];
      
        for (let i = 0; i < data.length; i += interval) {
          const date = new Date(data[i].timestamp);
          ticks.push(`${date.getMonth() + 1}/${date.getDate()}`);
        }
      
        // Ensure last label is included
        if (ticks.length < 5 && data.length > 0) {
          const lastDate = new Date(data[data.length - 1].timestamp);
          ticks.push(`${lastDate.getMonth() + 1}/${lastDate.getDate()}`);
        }
      
        return ticks;
      };
      const minY = Math.min(...data.map((candle) => candle.low));
       const maxY = Math.max(...data.map((candle) => candle.high));

// 2. Apply to `valueRangeY` (with slight padding for better visibility)
      const padding = (maxY - minY) * 0.1; // 10% padding
      const valueRangeY = [minY - padding, maxY + padding];
      return (
        
        <CandlestickChartProvider data={data} valueRangeY={[minY,maxY]}   >
          <CandlestickChart style={styles.chart}   >
          <view style={styles.chartText}>
              <Text style ={{ color : "#ffd700"}}  >Open: <CandlestickChart.PriceText type="open" style ={{ color : "#ffd700"}} /></Text>
              <Text style ={{ color : "#ffd700"}}  >High: <CandlestickChart.PriceText type="high" style ={{ color : "#ffd700"}}  /></Text>
              <Text style ={{ color : "#ffd700"}}  >Low: <CandlestickChart.PriceText type="low" style ={{ color : "#ffd700"}} /></Text>
              <Text style ={{ color : "#ffd700"}}  >Close: <CandlestickChart.PriceText type="close" style ={{ color : "#ffd700"}}  /></Text>
              <Text style ={{ color : "#ffd700"}}  >Timestamp: <CandlestickChart.DatetimeText style ={{ color : "#ffd700"}} /></Text>
         </view>
            <CandlestickChart.Candles
              positiveColor="#2E8B57" // Green for up candles
              negativeColor="#FF4500" // Red for down candles
              // scaleY={minY}
              
              // scale={[minY, maxY]}
              candleProps={{
                // width: 8, // Optimal width for visibility
                maxHeight:700,
                rectProps: {
                  height:0.2,
                  rx: 2,
                  ry: 2,
                  
                },
                lineProps: {
                  // Make wicks clearly visible
                  strokeWidth: 1.5,
                }
              }}
            />
            <CandlestickChart.Crosshair color="#ffd700" >
              <CandlestickChart.Tooltip />
            </CandlestickChart.Crosshair>

          </CandlestickChart>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 4, marginTop: 4 }}>
          {generateXTicks(data).map((item, index) => (
            <Text key={index} style={{ color: '#ffd700', fontSize: 10 }}>
              {item}
            </Text>
          ))}
        </View>

        </CandlestickChartProvider>
      );
    }

    if (chartType === 'line') {
      const lineChartData = data.map(bar => ({
        timestamp: bar.timestamp,
        value: bar.close, // use `close` price as the line chart value
      }));
      return (
        <LineChartProvider data={lineChartData}>
          <LineChart style={styles.chart}>
            <LineChart.Path />
            <LineChart.CursorCrosshair />
            <LineChart.Tooltip />
          </LineChart>
        </LineChartProvider>
      );
    }

    return null;
  };

  return <View style={styles.container}>{renderChart()}
      <View style={styles.zoomControls}>
            <TouchableOpacity 
              style={styles.zoomButton} 
              onPress={() => handleZoom(1.2)}
              disabled={visibleRange.end - visibleRange.start <= 5}
            >
              <Text>+</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.zoomButton} 
              onPress={() => handleZoom(0.8)}
              disabled={visibleRange.start === 0}
            >
              <Text>-</Text>
            </TouchableOpacity>
          </View></View>;
};

export default StockChart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    // backgroundColor: '#192130',
    backgroundColor: '#161d2a',

    // height: screenHeight < 700 ? screenHeight * 0.3 : 300,
    // maxWidth: 800,
    padding:10,
    alignSelf: 'center',
    // width: '100%',

  },
  chart: {
    overflowX:'hidden',
    height: screenHeight < 700 ? screenHeight * 0.3 : 300,
    
    flex: 1, // Important for proper chart sizing
    marginBottom: 10, // Space for zoom controls
    // flex: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 8,
  },
  zoomButton: {
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: '#2E8B57',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  zoomText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartText:{
    alignSelf: 'center',
    rowGap:'1',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,

  }
});
