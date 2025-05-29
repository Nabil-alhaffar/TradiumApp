// signalRService.js
import * as signalR from '@microsoft/signalr';

let connection;

export const connectToMarketData = async (onTrade, onQuote, onBar) => {
  connection = new signalR.HubConnectionBuilder()
    .withUrl('https://ec2-18-188-45-142.us-east-2.compute.amazonaws.com/hubs/marketdata') 
    .withAutomaticReconnect()
    .build();

  connection.on('ReceiveTrade', onTrade);
  connection.on('ReceiveQuote', onQuote);
  connection.on('ReceiveBar', onBar);

  try {
    await connection.start();
    console.log('SignalR connected');
  } catch (err) {
    console.error('SignalR connection failed:', err);
  }
};

export const joinSymbolGroup = async (symbol) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke('JoinGroup', symbol);
  }
};

export const disconnect = async () => {
  if (connection) await connection.stop();
};
