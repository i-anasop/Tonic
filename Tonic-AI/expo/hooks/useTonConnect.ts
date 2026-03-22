import { useCallback, useEffect, useState, useRef } from "react";
import {
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";

interface TonConnectState {
  isConnected: boolean;
  walletAddress: string | null;
  error: string | null;
  isInitialized: boolean;
}

interface UseTonConnectReturn extends TonConnectState {
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => Promise<boolean>;
  getWalletAddress: () => string | null;
}

export const useTonConnect = (): UseTonConnectReturn => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [state, setState] = useState<TonConnectState>({
    isConnected: false,
    walletAddress: null,
    error: null,
    isInitialized: false,
  });
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Check initialization and setup listeners
  useEffect(() => {
    if (tonConnectUI) {
      setState((prev) => ({ ...prev, isInitialized: true }));
      console.log("[useTonConnect] Successfully initialized");

      // Listen to wallet changes
      try {
        const unsubscribe = tonConnectUI.onStatusChange((walletInfo) => {
          console.log("[useTonConnect] Wallet status changed:", walletInfo);
          if (walletInfo) {
            console.log("[useTonConnect] Wallet connected with address:", walletInfo.account?.address);
          }
        });
        
        unsubscribeRef.current = unsubscribe;
      } catch (err) {
        console.error("[useTonConnect] Failed to setup status listener:", err);
      }

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    } else {
      console.warn("[useTonConnect] UI not yet initialized");
    }
  }, [tonConnectUI]);

  // Update connection state when wallet changes
  useEffect(() => {
    if (wallet && wallet.account && wallet.account.address) {
      const address = wallet.account.address;
      console.log("[useTonConnect] ✅ Wallet successfully connected:", address);
      console.log("[useTonConnect] Wallet account:", {
        address: wallet.account.address,
        chain: wallet.account.chain,
      });

      setState((prev) => ({
        ...prev,
        isConnected: true,
        walletAddress: address,
        error: null,
      }));
    } else {
      console.log("[useTonConnect] ❌ Wallet disconnected or not available");
      setState((prev) => ({
        ...prev,
        isConnected: false,
        walletAddress: null,
      }));
    }
  }, [wallet, wallet?.account?.address]);

  const connectWallet = useCallback(async (): Promise<boolean> => {
    try {
      if (!tonConnectUI) {
        const msg = "TonConnect UI not initialized. Please try again.";
        console.error("[useTonConnect]", msg);
        setState((prev) => ({ ...prev, error: msg }));
        throw new Error(msg);
      }

      console.log("[useTonConnect] 🔓 Opening wallet selection modal...");
      setState((prev) => ({ ...prev, error: null }));

      // Open modal - user can select and connect a wallet, or close the modal
      // The wallet state listener will detect when wallet is connected
      await tonConnectUI.openModal();

      console.log("[useTonConnect] ⏳ Modal closed");
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("[useTonConnect] ❌ Modal error:", errorMsg);
      throw err;
    }
  }, [tonConnectUI]);

  const disconnectWallet = useCallback(async (): Promise<boolean> => {
    try {
      if (!tonConnectUI) {
        throw new Error("TonConnect UI not available");
      }

      console.log("[useTonConnect] 🔐 Disconnecting wallet...");
      await tonConnectUI.disconnect();

      setState((prev) => ({
        ...prev,
        isConnected: false,
        walletAddress: null,
        error: null,
      }));
      console.log("[useTonConnect] ✅ Wallet disconnected");
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("[useTonConnect] ❌ Disconnection error:", errorMsg);
      setState((prev) => ({ ...prev, error: errorMsg }));
      throw err;
    }
  }, [tonConnectUI]);

  const getWalletAddress = useCallback((): string | null => {
    if (!wallet || !wallet.account || !wallet.account.address) {
      return null;
    }
    return wallet.account.address;
  }, [wallet]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    getWalletAddress,
  };
};

export default useTonConnect;
