import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

export interface UserSettings {
  fullName: string;
  phoneNumber: string;
  instaPayIPA: string; // username@instapay
}

const SETTINGS_KEY = 'quicksplit.user_settings';

export const saveSettings = (settings: UserSettings) => {
  storage.set(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSettings = (): UserSettings | null => {
  const data = storage.getString(SETTINGS_KEY);
  return data ? JSON.parse(data) : null;
};

export const hasSettings = (): boolean => {
  return storage.contains(SETTINGS_KEY);
};

export const clearAll = () => {
  storage.clearAll();
};
