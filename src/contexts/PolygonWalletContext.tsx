import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi'
import { bsc, polygon } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'

const { chains, provider, webSocketProvider } = configureChains(
    [polygon, mainnet, bsc],
    [publicProvider()],
  )
   
  // Set up client
export const client: any = createClient({
    connectors: [ 
      new MetaMaskConnector({ chains }),
      new CoinbaseWalletConnector({
        chains,
        options: {
          appName: 'wagmi',
        },
      })
    ],
    provider,
    webSocketProvider,
})