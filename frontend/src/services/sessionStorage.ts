import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const webTokens = new Map<string, string>();

export function createTokenStorage(key: string) { return {
  read: () => Platform.OS === "web" ? Promise.resolve(webTokens.get(key) ?? null) : SecureStore.getItemAsync(key),
  write: async (token: string) => {
    if (Platform.OS === "web") webTokens.set(key, token);
    else await SecureStore.setItemAsync(key, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  },
  clear: async () => {
    if (Platform.OS === "web") webTokens.delete(key);
    else await SecureStore.deleteItemAsync(key);
  },
}; }
