import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors, Shadows } from '../constants/theme';
import { saveSettings, getSettings, UserSettings } from '../utils/storage';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [instaPayIPA, setInstaPayIPA] = useState('');

  useEffect(() => {
    const existing = getSettings();
    if (existing) {
      setFullName(existing.fullName);
      setPhoneNumber(existing.phoneNumber);
      setInstaPayIPA(existing.instaPayIPA);
    }
  }, []);

  const handleSave = () => {
    if (!fullName || !phoneNumber || !instaPayIPA) {
      Alert.alert('Incomplete Fields', 'Please fill in all mandatory fields.');
      return;
    }

    if (!instaPayIPA.includes('@instapay')) {
      Alert.alert('Invalid IPA', 'Your InstaPay IPA should be in the format: username@instapay');
      return;
    }

    const settings: UserSettings = {
      fullName,
      phoneNumber,
      instaPayIPA,
    };

    saveSettings(settings);
    Alert.alert('Settings Saved', 'Mission control is ready!', [
      { text: 'Launch!', onPress: () => router.replace('/') }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Let's set up your profile for office splitting.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Mahmoud Ahmed"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 01012345678"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <Text style={styles.label}>InstaPay IPA</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. mahmoud@instapay"
          autoCapitalize="none"
          value={instaPayIPA}
          onChangeText={setInstaPayIPA}
        />
        <Text style={styles.info}>Necessary for friends to transfer money to you via InstaPay.</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    ...Shadows.medium,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  info: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    ...Shadows.light,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
