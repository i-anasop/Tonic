import { useCallback, useEffect, useState, useRef } from "react";
import {
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";
import { TON_REWARD_ADDRESS } from "@/constants/api";

interface TonConnectState {
  isConnected: boolean;
  walletAddress: string | null;
  error: string | null;
  isInitialized: boolean;
  isSendingTx: boolean;
}

export interface TonTxResult {
  boc: string;
}

interface UseTonConnectReturn extends TonConnectState {
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => Promise<boolean>;
  getWalletAddress: () => string | null;
  sendTransaction: (params: {
    to: string;
    amount: string;
    comment?: string;
  }) => Promise<TonTxResult>;
  recordAchievementOnChain: (params: {
    title: string;
    tasksCompleted: number;
    streak: number;
  }) => Promise<TonTxResult | null>;
}

export const useTonConnect = (): UseTonConnectReturn => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  // Keep a ref to the wallet so callbacks never use a stale closure
  const walletRef = useRef(wallet);
  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const [state, setState] = useState<TonConnectState>({
    isConnected: false,
    walletAddress: null,
    error: null,
    isInitialized: false,
    isSendingTx: false,
  });
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to TonConnect status changes for faster detection on mobile
  useEffect(() => {
    if (tonConnectUI) {
      setState((prev) => ({ ...prev, isInitialized: true }));

      try {
        const unsubscribe = tonConnectUI.onStatusChange((walletInfo) => {
          if (walletInfo && walletInfo.account?.address) {
            setState((prev) => ({
              ...prev,
              isConnected: true,
              walletAddress: walletInfo.account.address,
              error: null,
            }));
          } else {
            setState((prev) => ({
              ...prev,
              isConnected: false,
              walletAddress: null,
            }));
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
    }
  }, [tonConnectUI]);

  // Also sync state from the reactive wallet object (belt-and-suspenders)
  useEffect(() => {
    if (wallet && wallet.account && wallet.account.address) {
      const address = wallet.account.address;
      setState((prev) => ({
        ...prev,
        isConnected: true,
        walletAddress: address,
        error: null,
      }));
    } else {
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
        throw new Error("TonConnect UI not initialized. Please try again.");
      }
      setState((prev) => ({ ...prev, error: null }));
      await tonConnectUI.openModal();
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setState((prev) => ({ ...prev, error: errorMsg }));
      throw err;
    }
  }, [tonConnectUI]);

  const disconnectWallet = useCallback(async (): Promise<boolean> => {
    try {
      if (!tonConnectUI) throw new Error("TonConnect UI not available");
      await tonConnectUI.disconnect();
      setState((prev) => ({
        ...prev,
        isConnected: false,
        walletAddress: null,
        error: null,
      }));
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setState((prev) => ({ ...prev, error: errorMsg }));
      throw err;
    }
  }, [tonConnectUI]);

  const getWalletAddress = useCallback((): string | null => {
    if (!wallet?.account?.address) return null;
    return wallet.account.address;
  }, [wallet]);

  const sendTransaction = useCallback(
    async (params: {
      to: string;
      amount: string;
      comment?: string;
    }): Promise<TonTxResult> => {
      if (!tonConnectUI) throw new Error("TonConnect UI not initialized");

      // Use walletRef to avoid stale closure — always reads current wallet state
      const currentWallet = walletRef.current;
      if (!currentWallet?.account?.address) {
        throw new Error("Wallet not connected");
      }

      setState((prev) => ({ ...prev, isSendingTx: true }));
      try {
        let payload: string | undefined;
        if (params.comment) {
          const encoder = new TextEncoder();
          const encoded = encoder.encode(params.comment);
          const bytes = new Uint8Array(4 + encoded.length);
          bytes[0] = 0;
          bytes[1] = 0;
          bytes[2] = 0;
          bytes[3] = 0;
          bytes.set(encoded, 4);
          payload = btoa(String.fromCharCode(...bytes));
        }

        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [
            {
              address: params.to,
              amount: params.amount,
              ...(payload ? { payload } : {}),
            },
          ],
        };

        const result = await tonConnectUI.sendTransaction(transaction);
        return result as TonTxResult;
      } finally {
        setState((prev) => ({ ...prev, isSendingTx: false }));
      }
    },
    [tonConnectUI]
  );

  const recordAchievementOnChain = useCallback(
    async (params: {
      title: string;
      tasksCompleted: number;
      streak: number;
    }): Promise<TonTxResult | null> => {
      const currentWallet = walletRef.current;
      if (!currentWallet?.account?.address) return null;

      const comment = `Tonic AI | ${params.title} | Tasks: ${params.tasksCompleted} | Streak: ${params.streak}d`;

      try {
        const result = await sendTransaction({
          to: TON_REWARD_ADDRESS,
          amount: "10000000",
          comment,
        });
        return result;
      } catch (err) {
        console.error("[TON] Failed to record achievement:", err);
        return null;
      }
    },
    [sendTransaction]
  );

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    getWalletAddress,
    sendTransaction,
    recordAchievementOnChain,
  };
};

export default useTonConnect;
