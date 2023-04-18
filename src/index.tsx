import Widget from "App";
import { client } from "contexts/PolygonWalletContext";
import { SmartWalletProvider } from "contexts/SmartWalletContext";
import { createRoot } from "react-dom/client";
import { WagmiConfig } from "wagmi";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <WagmiConfig client={client}>
    <SmartWalletProvider>
      <Widget />
    </SmartWalletProvider>
  </WagmiConfig>
);
