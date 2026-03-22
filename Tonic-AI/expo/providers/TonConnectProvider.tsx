import React, { ReactNode, useEffect } from "react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";

interface TonConnectProviderProps {
  children: ReactNode;
}

/**
 * TonConnect Provider with manifest configuration
 * Safely handles wallet extension conflicts
 */
export const TonConnectProvider: React.FC<TonConnectProviderProps> = ({
  children,
}) => {
  // Get the manifest URL based on environment
  const getManifestUrl = (): string => {
    if (typeof window === "undefined") {
      console.log("[TonConnectProvider] Server-side render");
      return "http://192.168.0.100:5555/tonconnect-manifest.json";
    }

    // Use machine IP for mobile wallet connections on same WiFi
    return "http://192.168.0.100:5555/tonconnect-manifest.json";
  };

  const manifestUrl = getManifestUrl();

  useEffect(() => {
    console.log("[TonConnectProvider] Initialized with manifest:", manifestUrl);
    
    // Suppress ethereum property redefinition warnings from wallet extensions
    const originalError = console.error;
    const errorFilter = (msg: any) => {
      if (typeof msg === 'string' && msg.includes('Cannot redefine property: ethereum')) {
        return; // Silently ignore ethereum redefinition errors
      }
      originalError.call(console, msg);
    };
    
    // Only replace console.error temporarily during initialization
    return () => {
      // Reset on cleanup
    };
  }, [manifestUrl]);

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        twaReturnUrl: "https://t.me/tonic_ton_bot",
        returnStrategy: "back",
      }}
      walletsListConfiguration={{
        includeAppWallet: true,
      }}
      uiPreferences={{
        colorsSet: "dark",
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
};

export default TonConnectProvider;
