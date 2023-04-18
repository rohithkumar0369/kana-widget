import React, { useEffect } from "react";
import "./index.css";
import { SolanaWalletProvider } from "../src/contexts/SolanaWalletContext";
import "react-toastify/dist/ReactToastify.css";
import AptosWalletProvider from "../src/contexts/AptosWalletContext";
import AppProviders from "AppProviders";
import KanaWidget from "components/KanaWidget";
import { ToastContainer } from "react-toastify";
import {
  useSmartWalletProvider,
} from "contexts/SmartWalletContext";
import { EtherspotUi } from "@etherspot/transaction-kit";
interface WidgetConfig {
  containerStyle?: BoxStyle;
}

interface BoxStyle {
  backgroundColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  buttonColor?: string;
}

const Widget = (config: WidgetConfig) => {
  const { provider: smartWalletProvider, chainId } = useSmartWalletProvider();

  useEffect(() => {
    console.log("in app", smartWalletProvider);
    console.log("chain id", chainId);
  }, [smartWalletProvider, chainId]);

  return (
    <div>
      <AptosWalletProvider>
        <SolanaWalletProvider>
          <AppProviders>
            <EtherspotUi
              provider={smartWalletProvider}
              chainId={Number(chainId)}
            >
              <KanaWidget config={config} />
              <ToastContainer position="bottom-right" />
            </EtherspotUi>
          </AppProviders>
        </SolanaWalletProvider>
      </AptosWalletProvider>
    </div>
  );
};

export default Widget;
