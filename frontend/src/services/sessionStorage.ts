import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const key = "gymbuddy.session.v1";
let webToken: string | null = null;

export const tokenStorage = {
  read: () => Platform.OS === "web" ? Promise.resolve(webToken) : SecureStore.getItemAsync(key),
  write: async (token: string) => {
    if (Platform.OS === "web") webToken = token;
    else await SecureStore.setItemAsync(key, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  },
  clear: async () => {
    if (Platform.OS === "web") webToken = null;
    else await SecureStore.deleteItemAsync(key);
  },
};
