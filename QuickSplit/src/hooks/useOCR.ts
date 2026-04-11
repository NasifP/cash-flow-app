import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import MlkitOcr from 'rn-mlkit-ocr';
import { Alert } from 'react-native';

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
}

export const useOCR = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ReceiptItem[]>([]);

  const scanReceipt = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to scan receipts.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled) return;

      setIsScanning(true);
      const uri = result.assets[0].uri;

      // Perform OCR
      const ocrResult = await MlkitOcr.detectFromUri(uri);
      
      if (!ocrResult || ocrResult.length === 0) {
        Alert.alert('OCR Failed', 'Could not extract text from this image. Please try again with a clearer photo.');
        return;
      }

      // Basic parsing logic: Looking for "Item Name ... Price"
      // This is a simplified version. A production app might use a more robust RegEx or an LLM.
      const items: ReceiptItem[] = [];
      ocrResult.forEach((block, index) => {
        const text = block.text;
        // Search for lines that look like: "Item Name 123.45"
        const lines = text.split('\n');
        lines.forEach(line => {
          const match = line.match(/(.+?)\s+([\d,.]+)\s*(?:EGP|LE)?$/i);
          if (match) {
            const name = match[1].trim();
            const price = parseFloat(match[2].replace(',', ''));
            if (!isNaN(price) && name.length > 2) {
              items.push({
                id: `${index}-${items.length}`,
                name,
                price,
              });
            }
          }
        });
      });

      if (items.length === 0) {
        Alert.alert('Parsing Error', 'We found text, but no price tags. We will enter manual mode.');
      }

      setExtractedItems(items);
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('System Error', 'An error occurred during OCR scanning.');
    } finally {
      setIsScanning(false);
    }
  };

  return { scanReceipt, isScanning, extractedItems, setExtractedItems };
};
