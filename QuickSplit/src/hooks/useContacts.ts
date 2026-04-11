import { useState } from 'react';
import * as Contacts from 'expo-contacts';
import { Alert } from 'react-native';

export interface Participant {
  id: string;
  name: string;
  phoneNumber?: string;
  avatar?: string;
}

export const useContacts = () => {
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([]);
  const [isPickerLoading, setIsPickerLoading] = useState(false);

  const pickParticipants = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Contacts access is required to select participants.');
        return;
      }

      setIsPickerLoading(true);
      // In a real app, you might show a list of contacts with checkboxes.
      // For this demo, we'll use the platform's default picker for individual selection
      // or implement a custom modal if multiple selection is needed.
      
      const contact = await Contacts.presentContactPickerAsync();
      
      if (contact) {
        const newParticipant: Participant = {
          id: contact.id || Math.random().toString(),
          name: contact.name,
          phoneNumber: contact.phoneNumbers?.[0]?.number,
          avatar: contact.imageAvailable ? contact.image?.uri : undefined,
        };

        // Add to list if not already there
        setSelectedParticipants(prev => {
          if (prev.find(p => p.id === newParticipant.id)) return prev;
          return [...prev, newParticipant];
        });
      }
    } catch (error) {
      console.error('Contacts Error:', error);
      Alert.alert('Error', 'Could not open contacts.');
    } finally {
      setIsPickerLoading(true); // Wait, should be false? Yes.
      setIsPickerLoading(false);
    }
  };

  const removeParticipant = (id: string) => {
    setSelectedParticipants(prev => prev.filter(p => p.id !== id));
  };

  return { pickParticipants, selectedParticipants, isPickerLoading, removeParticipant, setSelectedParticipants };
};
