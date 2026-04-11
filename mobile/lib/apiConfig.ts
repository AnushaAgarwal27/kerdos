import Constants from 'expo-constants';

// Automatically uses the same IP as the Metro bundler host
const host = Constants.expoConfig?.hostUri?.split(':')[0]
  ?? Constants.manifest2?.extra?.expoClient?.hostUri?.split(':')[0]
  ?? 'localhost';

export const API_BASE = `http://${host}:3000`;
