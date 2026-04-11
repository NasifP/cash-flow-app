import { Linking, Clipboard, Alert } from 'react-native';
import { Participant } from '../utils/math';
import * as Sharing from 'expo-sharing';

export const generateTelegramMessage = (
  p: Participant, 
  myInstaPay: string,
  myName: string
): string => {
  return `Good morning ${p.name}! 🌯
  
Today you had a great meal. Your share is ${p.total.toFixed(2)} EGP.

Please transfer via InstaPay to:
📱 ${myInstaPay}

Thanks!
- ${myName}`;
};

export const sendToTelegram = async (message: string) => {
  const url = `tg://msg?text=${encodeURIComponent(message)}`;
  
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    // Fallback to clipboard if Telegram is not installed
    Clipboard.setString(message);
    Alert.alert('Telegram not found', 'The message has been copied to your clipboard. You can paste it in any messaging app.');
  }
};

export const copyToClipboard = (message: string) => {
  Clipboard.setString(message);
  Alert.alert('Copied!', 'Message copied to clipboard.');
};
