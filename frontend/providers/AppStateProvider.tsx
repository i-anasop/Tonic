import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE_URL } from "@/constants/api";

export interface User {
  id: string;
  name: string;
  walletAddress?: string;
  profilePictureUri?: string;
  isGuest: boolean;
  createdAt: Date;
}

interface AppState {
  user: User | null;
  isOnboarded: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  completeOnboarding: () => void;
  createGuestUser: (name: string) => void;
  connectWallet: (address: string) => void;
  signOut: () => void;
  resetApp: () => Promise<void>;
}

const STORAGE_KEYS = {
  USER: "@tonic_user",
  ONBOARDED: "@tonic_onboarded",
};

async function syncUserToBackend(user: User): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        name: user.name,
        walletAddress: user.walletAddress || null,
        isGuest: user.isGuest,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.warn("User sync to backend failed (offline mode):", error);
  }
}

export const [AppStateProvider, useAppState] = createContextHook<AppState>(() => {
  const [user, setUserState] = useState<User | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoredData = useCallback(async () => {
    try {
      const [userData, onboardedData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED),
      ]);

      if (userData) {
        const parsed = JSON.parse(userData) as User;
        setUserState({ ...parsed, createdAt: new Date(parsed.createdAt) });
      } else {
        const defaultUser: User = {
          id: "guest_default",
          name: "Guest User",
          isGuest: true,
          createdAt: new Date(),
        };
        setUserState(defaultUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
      }

      if (onboardedData) {
        setIsOnboarded(JSON.parse(onboardedData) as boolean);
      }
    } catch (error) {
      console.error("Error loading app state:", error);
      const defaultUser: User = {
        id: "guest_default",
        name: "Guest User",
        isGuest: true,
        createdAt: new Date(),
      };
      setUserState(defaultUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStoredData();
  }, [loadStoredData]);

  const saveUser = useCallback(async (newUser: User | null) => {
    if (newUser) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      void syncUserToBackend(newUser);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, []);

  const setUser = useCallback(
    (newUser: User | null) => {
      setUserState(newUser);
      void saveUser(newUser);
    },
    [saveUser]
  );

  const completeOnboarding = useCallback(async () => {
    setIsOnboarded(true);
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, JSON.stringify(true));
  }, []);

  const createGuestUser = useCallback(
    (name: string) => {
      const newUser: User = {
        id: `guest_${Date.now()}`,
        name,
        isGuest: true,
        createdAt: new Date(),
      };
      setUser(newUser);
      void completeOnboarding();
    },
    [setUser, completeOnboarding]
  );

  const connectWallet = useCallback(
    (address: string) => {
      const newUser: User = {
        id: `wallet_${address.slice(-12)}`,
        name: "TON User",
        walletAddress: address,
        isGuest: false,
        createdAt: new Date(),
      };
      setUser(newUser);
      void completeOnboarding();
    },
    [setUser, completeOnboarding]
  );

  const signOut = useCallback(async () => {
    setUserState(null);
    setIsOnboarded(false);
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.ONBOARDED]);
  }, []);

  const resetApp = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      setUserState(null);
      setIsOnboarded(false);
      setIsLoading(true);
      setTimeout(() => void loadStoredData(), 500);
    } catch (error) {
      console.error("Reset failed:", error);
    }
  }, [loadStoredData]);

  return useMemo(
    () => ({
      user,
      isOnboarded,
      isLoading,
      setUser,
      completeOnboarding,
      createGuestUser,
      connectWallet,
      signOut,
      resetApp,
    }),
    [user, isOnboarded, isLoading, setUser, completeOnboarding, createGuestUser, connectWallet, signOut, resetApp]
  );
});
