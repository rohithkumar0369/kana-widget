import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Web3AuthCore } from "@web3auth/core";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import {
  REACT_APP_CHAIN_ID_HEX,
  web3AuthClientId,
  EVM_CHAIN_ID,
  EVM_RPC_MAINNET,
} from "../utils/Constants";
import {
  ADAPTER_EVENTS,
  CHAIN_NAMESPACES,
  WALLET_ADAPTERS,
  WALLET_ADAPTER_TYPE,
} from "@web3auth/base";
import Web3 from "web3";
import { useAccount } from "wagmi";

export enum ConnectType {
  METAMASK,
  WALLETCONNECT,
}

type LOGIN_PROVIDER_TYPE =
  | "google"
  | "facebook"
  | "apple"
  | "discord"
  | "twitch"
  | "github"
  | "twitter"
  | "email_passwordless";

// export type Provider = ethers.providers.Web3Provider | undefined;
export type Provider = any;

// const EVM_CHAIN_ID = {
//   POLYGON: "137",
//   BINANCE: "56"
// };

interface ISmartWalletProviderContext {
  isConnected: boolean;
  web3Auth: Web3AuthCore | null;
  provider: any;
  connect(connectType: LOGIN_PROVIDER_TYPE, login_hint?: string): void;
  disconnect(): void;
  setShowEmailModal(value: boolean): void;
  isSigningIn: boolean;
  chainId: string | undefined;
  setChain(chainId: string): void;
  showEmailLogin: boolean;
  isSocialLogin: boolean;
}

const SmartWalletProviderContext = createContext<ISmartWalletProviderContext>({
  isConnected: false,
  connect: (connectType: LOGIN_PROVIDER_TYPE, login_hint?: string) => {},
  setShowEmailModal: (value: boolean) => {},
  disconnect: () => {},
  provider: undefined,
  web3Auth: null,
  isSigningIn: false,
  chainId: EVM_CHAIN_ID.POLYGON,
  setChain: (chainId: string) => {},
  showEmailLogin: false,
  isSocialLogin: false,
});

export const SmartWalletProvider = ({ children }: { children: ReactNode }) => {
  const { connector, isConnected: web3IsConnected } = useAccount();
  const [provider, setProvider] = useState<Provider>(undefined);
  const [web3Auth, setWeb3Auth] = useState<Web3AuthCore | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isConnected, setIsconnected] = useState(false);
  const [isInitialized, setIsInitialize] = useState(false);
  const [chainId, setChainId] = useState<string | undefined>(undefined);
  const [connectType, setConnectType] = useState<
    LOGIN_PROVIDER_TYPE | undefined
  >(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEmailLogin, setShowEmailLogin] = useState<boolean>(false);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [isSocialLogin, setIsSocialLogin] = useState<boolean>(false);

  const initWeb3AuthCore = useCallback(async () => {
    // if (!!localStorage.getItem('Web3Auth-cachedAdapter')) setIsSigningIn(true);

    let rpc_url;
    if (chainId === EVM_CHAIN_ID.BINANCE) {
      rpc_url = EVM_RPC_MAINNET.BINANCE;
    } else {
      rpc_url = EVM_RPC_MAINNET.POLYGON;
    }

    const web3AuthInstance = new Web3AuthCore({
      clientId: web3AuthClientId,
      chainConfig: {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: REACT_APP_CHAIN_ID_HEX.POLYGON,
        rpcTarget: rpc_url,
      },
      storageKey: "local",
    });

    const openLoginAdapter = new OpenloginAdapter({
      adapterSettings: {
        network: "mainnet",
        clientId: web3AuthClientId,
      },
      loginSettings: {
        mfaLevel: "none",
      },
    });

    web3AuthInstance.configureAdapter(openLoginAdapter);

    web3AuthInstance.on(ADAPTER_EVENTS.CONNECTED, () => {
      if (!web3AuthInstance?.provider) return;
      // const provider = new ethers.providers.Web3Provider(web3AuthInstance?.provider, 'any');
      const web3 = new Web3(web3AuthInstance?.provider as any);
      setProvider(web3.currentProvider);
      setIsconnected(true);
      setIsSocialLogin(true);
      // console.log("connected",web3.currentProvider)
      setIsSigningIn(false);
    });

    web3AuthInstance.on(ADAPTER_EVENTS.ERRORED, () => {
      setIsSigningIn(false);
    });

    await web3AuthInstance.init();

    setIsSigningIn(false);

    setWeb3Auth(web3AuthInstance);
  }, [chainId]);

  useEffect(() => {
    setChainId(EVM_CHAIN_ID.POLYGON);
    setIsInitialize(true);
    // initWeb3AuthCore();
  }, []);

  useEffect(() => {
    setIsInitialize(false);
  }, [chainId]);

  const setChain = useCallback((chainId: string) => {
    setChainId(chainId);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      initWeb3AuthCore();
    }
  }, [isInitialized]);

  useEffect(() => {
    const update = async () => {
      if (!connector?.ready || !web3IsConnected) {
        setProvider(undefined);
        setIsconnected(false);
        return;
      }
      const wagmiWeb3Provider = await connector.getProvider();
      setProvider(wagmiWeb3Provider);
      setIsconnected(true);
    };

    update();
  }, [connector, web3IsConnected]);

  const loginWithAdapter = useCallback(
    async (
      adapter: WALLET_ADAPTER_TYPE,
      loginProvider?: LOGIN_PROVIDER_TYPE,
      login_hint?: string
    ) => {
      setErrorMessage(null);
      setIsSigningIn(true);
      if (!web3Auth) {
        setIsSigningIn(false);
        return;
      }

      let web3authProvider;
      try {
        web3authProvider = await web3Auth.connectTo(adapter, {
          loginProvider,
          login_hint,
        });
        setIsSocialLogin(true);
      } catch (e) {
        console.log("error", e);
        setErrorMessage(
          `Failed to login! Reason: ${
            e instanceof Error && e?.message ? e.message : "unknown"
          }.`
        );
        setIsSigningIn(false);
        return;
      }

      if (!web3authProvider) {
        setErrorMessage("Failed to get connected provider!");
        setIsSigningIn(false);
        return;
      }

      setEmail("");
      setShowEmailModal(false);
      setIsSigningIn(false);
    },
    [web3Auth]
  );

  const loginWithOpenLogin = useCallback(
    async (loginProvider: LOGIN_PROVIDER_TYPE, login_hint?: string) =>
      loginWithAdapter(WALLET_ADAPTERS.OPENLOGIN, loginProvider, login_hint),
    [loginWithAdapter]
  );

  const connect = useCallback(
    (connectType: LOGIN_PROVIDER_TYPE, login_hint?: string) => {
      setConnectType(connectType);
      loginWithOpenLogin(connectType, login_hint);
    },
    [loginWithOpenLogin]
  );

  const setShowEmailModal = useCallback((value: boolean) => {
    setShowEmailLogin(value);
  }, []);

  const disconnect = useCallback(async () => {
    await web3Auth?.logout({ cleanup: true });
    web3Auth?.clearCache();
    setProvider(undefined);
    setIsconnected(false);
    setIsSocialLogin(false);
    initWeb3AuthCore();
  }, [web3Auth]);

  const contextValue = useMemo(
    () => ({
      isConnected,
      provider,
      web3Auth,
      setShowEmailModal,
      connect,
      disconnect,
      isSigningIn,
      chainId,
      showEmailLogin,
      setChain,
      isSocialLogin,
      setIsSocialLogin,
    }),
    [
      isConnected,
      provider,
      web3Auth,
      setShowEmailModal,
      connect,
      disconnect,
      isSigningIn,
      chainId,
      showEmailLogin,
      setChain,
      isSocialLogin,
      setIsSocialLogin,
    ]
  );

  return (
    <SmartWalletProviderContext.Provider value={contextValue}>
      {children}
    </SmartWalletProviderContext.Provider>
  );
};

export const useSmartWalletProvider = () => {
  return useContext(SmartWalletProviderContext);
};
