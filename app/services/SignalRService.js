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

  if (isConnected && connection?.state === HubConnectionState.Connected) {
    console.log('SignalR already connected');
    return;
  }

  if (connection) {
    try {
      await connection.stop();
    } catch (err) {
      console.warn('Error stopping existing connection:', err);
    }
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl('https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/hubs/marketdata')
    .withAutomaticReconnect()
    .build();

  connection.on('ReceiveTrade', (data) => {
    console.log('Received trade:', data);
    tradeListeners.forEach(cb => cb(data));
  });

  connection.on('ReceiveQuote', (data) => {
    console.log('Received quote:', data);
    quoteListeners.forEach(cb => cb(data));
  });

  connection.on('ReceiveBar', (data) => {
    console.log('Received bar:', data);
    barListeners.forEach(cb => cb(data));
  });

  connection.onclose(() => {
    console.log('SignalR connection closed');
    isConnected = false;
  });

  connection.onreconnecting(() => {
    console.log('SignalR reconnecting...');
    isConnected = false;
  });

  connection.onreconnected(() => {
    console.log('SignalR reconnected');
    isConnected = true;
  });

  try {
    await connection.start();
    isConnected = true;
    console.log('SignalR connected');
  } catch (err) {
    console.error('SignalR connection failed:', err);
    isConnected = false;
  }
};

export const disconnect = async () => {
  if (connection && connection.state === HubConnectionState.Connected) {
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
  if (!connection || connection.state !== HubConnectionState.Connected) {
    console.warn('SignalR not connected. Attempting to reconnect...');
    await connectToMarketData();
  }

  try {
    await connection.invoke('JoinGroup', symbol);
    console.log('Joined symbol group:', symbol);
  } catch (err) {
    console.error('Error joining symbol group:', err);
  }
};

export const leaveSymbolGroup = async (symbol) => {
  if (connection && connection.state === HubConnectionState.Connected) {
    try {
      await connection.invoke('LeaveGroup', symbol);
      console.log('Left symbol group:', symbol);
    } catch (err) {
      console.error('Error leaving symbol group:', err);
    }
  } else {
    console.warn('SignalR not connected. Cannot leave symbol group.');
  }
};

export const registerTradeListener = (cb) => {
  if (!tradeListeners.includes(cb)) {
    tradeListeners.push(cb);
  }
};

export const registerQuoteListener = (cb) => {
  if (!quoteListeners.includes(cb)) {
    quoteListeners.push(cb);
  }
};

export const registerBarListener = (cb) => {
  if (!barListeners.includes(cb)) {
    barListeners.push(cb);
  }
};

export const removeTradeListener = (cb) => {
  const index = tradeListeners.indexOf(cb);
  if (index > -1) {
    tradeListeners.splice(index, 1);
  }
};

export const removeQuoteListener = (cb) => {
  const index = quoteListeners.indexOf(cb);
  if (index > -1) {
    quoteListeners.splice(index, 1);
  }
};

export const removeBarListener = (cb) => {
  const index = barListeners.indexOf(cb);
  if (index > -1) {
    barListeners.splice(index, 1);
  }
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
