import React, { ReactNode } from "react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { API_BASE_URL } from "@/constants/api";

interface TonConnectProviderProps {
  children: ReactNode;
}

export const TonConnectProvider: React.FC<TonConnectProviderProps> = ({
  children,
}) => {
  const manifestUrl = `${API_BASE_URL}/tonconnect-manifest.json`;

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
