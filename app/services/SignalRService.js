// signalRService.js
import * as signalR from '@microsoft/signalr';
import { HubConnectionState } from '@microsoft/signalr';

let connection = null;
let isConnected = false;

let tradeListeners = [];
let quoteListeners = [];
let barListeners = [];

export const connectToMarketData = async (onTrade, onQuote, onBar) => {
  if (onTrade) tradeListeners.push(onTrade);
  if (onQuote) quoteListeners.push(onQuote);
  if (onBar) barListeners.push(onBar);

  if (isConnected) return;

  connection = new signalR.HubConnectionBuilder()
    .withUrl('https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/hubs/marketdata')
    .withAutomaticReconnect()
    .build();

  connection.on('ReceiveTrade', (data) => {
    tradeListeners.forEach(cb => cb(data));
  });

  connection.on('ReceiveQuote', (data) => {
    quoteListeners.forEach(cb => cb(data));
  });

  connection.on('ReceiveBar', (data) => {
    barListeners.forEach(cb => cb(data));
  });

  try {
    await connection.start();
    isConnected = true;
    console.log('SignalR connected');
  } catch (err) {
    console.error('SignalR connection failed:', err);
  }
};

export const disconnect = async () => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.stop();
    console.log('SignalR disconnected');
  } else {
    console.warn('SignalR already disconnected or not initialized.');
  }

  isConnected = false;
  tradeListeners = [];
  quoteListeners = [];
  barListeners = [];
};


export const joinSymbolGroup = async (symbol) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke('JoinGroup', symbol);
  } else {
    console.warn('SignalR not connected. Cannot join symbol group.');
  }
};

export const leaveSymbolGroup = async (symbol) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke('LeaveGroup', symbol);
  } else {
    console.warn('SignalR not connected. Cannot leave symbol group.');
  }
};

export const registerTradeListener = (cb) => {
  tradeListeners.push(cb);
};

export const registerQuoteListener = (cb) => {
  quoteListeners.push(cb);
};

export const registerBarListener = (cb) => {
  barListeners.push(cb);
};
// // signalRService.js
// import * as signalR from '@microsoft/signalr';

// let connection;

// export const connectToMarketData = async (onTrade, onQuote, onBar) => {
//   connection = new signalR.HubConnectionBuilder()
//     .withUrl('https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/hubs/marketdata') 
//     .withAutomaticReconnect()
//     .build();

//   connection.on('ReceiveTrade', onTrade);
//   connection.on('ReceiveQuote', onQuote);
//   connection.on('ReceiveBar', onBar);

//   try {
//     await connection.start();
//     console.log('SignalR connected');
//   } catch (err) {
//     console.error('SignalR connection failed:', err);
//   }
// };

// export const joinSymbolGroup = async (symbol) => {
//   if (connection && connection.state === signalR.HubConnectionState.Connected) {
//     await connection.invoke('JoinGroup', symbol);
//   }
// };

// export const disconnect = async () => {
//   if (connection) await connection.stop();
// };
