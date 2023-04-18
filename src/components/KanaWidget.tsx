import * as React from "react";
import {
  AptosTxType,
  CheckAllowance,
  Environment,
  getBridgeinstruction,
  getQuotesforCrossChainSwap,
  getSwapInstruction,
  getSwapQuote,
  getVaaForWormholeEvm,
  kanaChainIdList,
} from "kana-aggregator-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ResetIcon from "../assets/icons/resetIcon.svg";
import SettingsIcon from "../assets/icons/settings.svg";
import SwapIcon from "../assets/icons/swapIcon.svg";
import Solana from "../assets/images/solana.svg";
import Aptos from "../assets/images/aptos.webp";
import EthereumImg from "../assets/images/eth.svg";
import CloseIcon from "../assets/icons/closeIcon.svg";
import SearchIcon from "../assets/icons/searchIcon.svg";
import Polygon from "../assets/images/polygon.svg";
import Web3AuthLogo from "../assets/icons/web3auth-avatar.png";
import wormhole from "../assets/icons/wormhole.svg";
import {
  APTOS_TOKEN_1,
  APTOS_TOKEN_2,
  POLYGON_TOKEN_1,
  POLYGON_TOKEN_2,
  SOLANA_TOKEN_1,
  SOLANA_TOKEN_2,
  BINANCE_TOKEN_1,
  BINANCE_TOKEN_2,
  ETHEREUM_TOKEN_1,
  ETHEREUM_TOKEN_2,
} from "utils/defaultTokens";
import { useImmer } from "use-immer";
import { useQuery } from "@tanstack/react-query";
import { getTokensAcrossAllChain } from "services/api/kanalabs";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useAptosContext } from "contexts/AptosWalletContext";
import { useWallet } from "@solana/wallet-adapter-react";
import ConnectWallet from "./ConnectWallet";
import {
  getAllAptosTokenBalance,
  getAllSolanaTokenBalance,
  getAllEVMTokenBalance,
  getAptosStructuredRoutes,
  getCrossChainAptosRoute,
  getCrossChainSolanaRoute,
  getSolanaStructuredRoutes,
  getTokenDecimals,
  getUiAmount,
  isObjectNonEmpty,
  preventPasteNegativeNumber,
  trimToFloor,
  validateSolAddress,
  getAptosRpcEndPoint,
  validateAptAddress,
  getAptosNativeBalance,
  SolTokenMaxCalc,
  AptTokenMaxCalc,
  MaticTokenMaxCalc,
  getEvmStructuredRoutes,
  getEvmNativeBalance,
  getCrossChainEvmRoute,
  BSCTokenMaxCalc,
  ETHTokenMaxCalc,
  getPolygonHashFromBatchHash,
  getBSCHashFromBatchHash,
} from "utils/Helper";
import useDebounce from "hooks/useDebounce";
import { toast } from "react-toastify";
import TimeIcon from "../assets/icons/timeIcon.svg";
import DropdownIcon from "../assets/icons/dropdownIcon.svg";
import RecommendedIcon from "../assets/icons/recommendedIcon.svg";
import { BeatLoader, ClipLoader } from "react-spinners";
import CustomModal from "./CustomModal";
import {
  submitAptosEntryFunctionPayload,
  submitSolanaversionedTransaction,
  submitSwapTransactionEvm,
  submitSwapXTransactionEvm,
} from "utils/Sign";
import CopyIcon from "../assets/icons/copyIcon.svg";
import CompletedIcon from "../assets/icons/completedIcon.svg";
import FailedIcon from "../assets/icons/failedIcon.svg";
import Coinbase from "../assets/icons/coinbase.svg";
import MetaMask from "../assets/icons/metamask.svg";
import Binance from "../assets/images/binance.svg";
import {
  crossChainBridging,
  crossChainTargetClaim,
  executeBridgeInstructionForAptos,
  executeBridgeInstructionForSolana,
  getTargetChainFromVaa,
  sourceSwap,
} from "utils/CrossChain";
import Select from "react-select";
import {
  CHAIN_ID_APTOS,
  CHAIN_ID_BSC,
  CHAIN_ID_ETH,
  CHAIN_ID_POLYGON,
  CHAIN_ID_SOLANA,
} from "@certusone/wormhole-sdk";
import {
  useAccount,
  useConnect,
  useNetwork,
  useProvider,
  useSigner,
  useSwitchNetwork,
} from "wagmi";
import RedeemModal from "./RedeemModal";
import { useInterval } from "../hooks/useInterval";
import { isValidNumber } from "../utils/Helper";
import { getProvider, fetchSigner } from "@wagmi/core";

import { BigNumber, ethers } from "ethers";
import { ExternalProvider } from "@ethersproject/providers";
import { useSmartWalletProvider } from "contexts/SmartWalletContext";
import { EVM_CHAIN_ID } from "utils/Constants";
import {
  EtherspotBatch,
  EtherspotBatches,
  EtherspotTransaction,
  useEtherspotAddresses,
  useEtherspotUi,
} from "@etherspot/transaction-kit";
import BN from "bn.js";
import { sleep } from "etherspot";
import { async } from "q";

interface ProgressType {
  status: string | null;
  hash: string | null;
  completionPercentage: number;
}

interface BridgingType {
  status: string | null;
  completionPercentage: number;
}

const options = [
  {
    label: (
      <span
        className="text-sm rounded-lg text-white flex h-8 items-center"
        id="chain_aptos"
      >
        <img className="w-7 h-7" src={Aptos} alt="Aptos" />
        <span className="ml-2 text-base">Aptos</span>
      </span>
    ),
    value: kanaChainIdList.aptos,
  },
  {
    label: (
      <span
        className="text-sm rounded-lg text-white flex h-8 items-center"
        id="chain_solana"
      >
        <img className="w-7 h-7" src={Solana} alt="Aptos" />
        <span className="ml-2 text-base">Solana</span>
      </span>
    ),
    value: kanaChainIdList.solana,
  },
  {
    label: (
      <span
        className="text-sm rounded-lg text-white flex h-8 items-center"
        id="chain_polygon"
      >
        <img className="w-7 h-7" src={Polygon} alt="Aptos" />
        <span className="ml-2 text-base">Polygon</span>
      </span>
    ),
    value: kanaChainIdList.polygon,
  },
  {
    label: (
      <span
        className="text-sm rounded-lg text-white flex h-8 items-center"
        id="chain_binance"
      >
        <img className="w-7 h-7" src={Binance} alt="Aptos" />
        <span className="ml-2 text-base">BSC</span>
      </span>
    ),
    value: kanaChainIdList.binance,
  },
  {
    label: (
      <span
        className="text-sm rounded-lg text-white flex h-8 items-center"
        id="chain_eth"
      >
        <img className="w-7 h-7" src={EthereumImg} alt="Aptos" />
        <span className="ml-2 text-base">Ethereum</span>
      </span>
    ),
    value: kanaChainIdList.ethereum,
  },
];

const redeemColorStyles = {
  option: (styles: any) => {
    return {
      ...styles,
      // background: props.config.containerStyle.secondaryColor ? props.config.containerStyle.secondaryColor : '#2c2533',
      background: "#2c2533",
      "&:active": {
        // overriding hover
        background: "#2c2533",
        // background: props.config.containerStyle.secondaryColor ? props.config.containerStyle.secondaryColor : '#2c2533',
      },
    };
  },
};
const KanaWidget = (props: any) => {
  const [isRoutesVisible, setRoutesVisibility] = useState(false);
  const [chainAndTokenListVisibility, setChainAndTokenListVisibility] =
    useState({
      visibility: false,
      clickedFrom: "",
    });
  const [walletConnectVisibility, setWalletConnectVisibility] = useState({
    visibility: false,
    clickedFrom: "",
  });
  const [redeemWalletConnectVisibility, setRedeemWalletConnectVisibility] =
    useState({
      visibility: false,
      clickedFrom: "",
    });
  const [chainAddress, setChainAddress] = useImmer<any>({
    targetChainAddress: "",
    sourceChainAddress: "",
  });
  const [sourceInfo, setSourceInfo] = useImmer<any>({
    chainId: kanaChainIdList.aptos,
    chainName: "Aptos",
    chainImg: Aptos,
    tokenSymbol: APTOS_TOKEN_1.symbol,
    tokenImg: APTOS_TOKEN_1.logoURI,
    tokenAmount: "",
    tokenAddress: APTOS_TOKEN_1.address,
    tokenBalance: 0,
  });
  const [targetInfo, setTargetInfo] = useImmer({
    chainId: kanaChainIdList.aptos,
    chainName: "Aptos",
    chainImg: Aptos,
    tokenSymbol: APTOS_TOKEN_2.symbol,
    tokenImg: APTOS_TOKEN_2.logoURI,
    tokenAmount: "",
    tokenAddress: APTOS_TOKEN_2.address,
    tokenBalance: 0,
  });

  // const [swapI]
  const [sourceTokenList, setSourceTokenList] = useState<any>(null);
  const [targetTokenList, setTargetTokenList] = useState<any>(null);
  const [tokenSearchText, setTokenSearchText] = useState("");
  const [availableSolanaTokens, setAvailableSolanaTokens] = useState<any>(null);
  const [availableAptosTokens, setAvailableAptosTokens] = useState<any>(null);
  const [availablePolygonTokens, setAvailablePolygonTokens] =
    useState<any>(null);
  const [availableBinanceTokens, setAvailableBinanceTokens] =
    useState<any>(null);
  const [availableEthereumTokens, setAvailableEthereumTokens] =
    useState<any>(null);
  const [walletSearchText, setWalletSearchText] = useState("");
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [crossChainRoutes, setCrossChainRoutes] = useState<any>(null);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const [isRouteLoading, setRouteLoading] = useState(false);
  const [isPreviewVisible, setPreviewVisibility] = useState(false);
  const [isSwapModalVisible, setSwapModalVisibility] = useState(false);
  const [sameChainSwap, setSameChainSwap] = useState<any>({
    status: null,
    hash: null,
    completionPercentage: 0,
  });
  const [sourceChainSwap, setSourceChainSwap] = useState<ProgressType>({
    status: null,
    hash: null,
    completionPercentage: 0,
  });
  const [swapBridging, setSwapBridging] = useState<BridgingType>({
    status: null,
    completionPercentage: 0,
  });
  const [targetChainSwap, setTargetChainSwap] = useState<ProgressType>({
    status: null,
    hash: null,
    completionPercentage: 0,
  });
  const [sourceChainRoute, setSourceChainRoute] = useState<any>(null);
  const [targetChainRoute, setTargetChainRoute] = useState<any>(null);
  const [redeemViewVisibility, setRedeemViewVisibility] = useState(false);
  const [isTokenListLoading, setTokenListLoading] = useState(false);
  const [redeemChain, setRedeemChain] = useState<any>(null);
  const [redeemSignature, setRedeemSignature] = useState<any>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemData, setRedeemData] = useState<any>({
    chainId: null,
    chainImg: null,
    chainName: "",
    tokenAmount: null,
    tokenUsd: null,
  });
  const [isRedeemModalVisible, setRedeemModalVisibility] = useState(false);
  const [isSettingsViewVisible, setSettingsViewVisibility] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [sameChainEstimationTime, setSameChainEstimationTime] = useState("");
  const [crossChainEstimationTime, setCrossChainEstimationTime] = useState("");
  const [allowInterChange, setAllowInterChange] = useState(true);
  const [swapInstructionResponse, setSwapInstructionResponse] =
    useState<any>(null);
  const [slippageInputDisabled, setSlippageInputDisabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [polygon_address, setPolygonAddress] = useState<any>(undefined);
  const [binance_address, setBinanceAddress] = useState<any>(undefined);
  const [swapIx, setSwapIx] = useState([]);
  const [swapable, setIsSwapable] = useState<any>(undefined);
  const [crossIx, setCrossIx] = useState<any>(undefined);
  // const [batches, setBatches] = useState<any>(undefined);

  const {
    connected: solanaWalletConnected,
    publicKey,
    signTransaction,
    wallet,
  } = useWallet();
  const {
    connected,
    account,
    signAndSubmitTransaction,
    wallet: connectedAptosWallet,
  } = useAptosContext();
  const aptosWallet = useAptosContext();
  const { connector, address } = useAccount();
  // const provider = new ethers.providers.Web3Provider(wagmiProvider as ExternalProvider, 'any')
  // let signer = fetchSigner();
  let { data: signer } = useSigner();
  // let signer = fetchSigner();
  const routesRef = useRef<any>(null);
  const { chain } = useNetwork();
  let provider = useProvider();
  // let provider = getProvider();
  const network = useSwitchNetwork();
  const {
    chainId,
    setChain,
    provider: SmartWalletProvider,
    isConnected: isEVMConnected,
    setShowEmailModal,
    isSocialLogin,
  } = useSmartWalletProvider();
  const addresses = useEtherspotAddresses();
  const { estimate, send } = useEtherspotUi();

  useEffect(() => {
    console.log({ chainAddress });
  }, [chainAddress]);

  useEffect(() => {
    console.log({ isSocialLogin });
  }, [isSocialLogin]);

  const switchEvmNetwork = (chainId: any) => {
    switch (chainId) {
      case kanaChainIdList.ethereum:
        // network.switchNetworkAsync && network.switchNetworkAsync(1);
        connector?.switchChain && connector?.switchChain(1);
        // vaa()
        break;
      case kanaChainIdList.polygon:
        // network.switchNetworkAsync && network.switchNetworkAsync(137);
        connector?.switchChain && connector?.switchChain(137);
        break;
      case kanaChainIdList.binance:
        // network.switchNetworkAsync && network.switchNetworkAsync(56);
        connector?.switchChain && connector?.switchChain(56);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    //Change network of source chain after wallet connect
    if (address) {
      switchEvmNetwork(sourceInfo.chainId);
    }
  }, [address, sourceInfo.chainId]);

  useEffect(() => {
    const getCurrentSmartWalletAddress = (chainId: any) => {
      const obj = addresses.find((item) => item?.chainId === chainId);
      return obj ? obj : undefined;
    };

    if (isEVMConnected && isSocialLogin) {
      if (sourceInfo.chainId === 3 || targetInfo.chainId === 3) {
        let pol_address = getCurrentSmartWalletAddress(Number("137"));
        setPolygonAddress(pol_address?.address);
        setBinanceAddress(undefined);
      } else if (sourceInfo.chainId === 5 || targetInfo.chainId === 5) {
        let bsc_address = getCurrentSmartWalletAddress(Number("56"));
        setBinanceAddress(bsc_address?.address);
        setPolygonAddress(undefined);
      }
    } else {
      setBinanceAddress(undefined);
      setPolygonAddress(undefined);
    }
  }, [
    SmartWalletProvider,
    addresses,
    isEVMConnected,
    isSocialLogin,
    // sourceInfo.chainId,
    // targetInfo.chainId,
  ]);

  useEffect(() => {
    console.log({ polygon_address, binance_address });
  }, [polygon_address, binance_address]);

  useEffect(() => {
    if (redeemViewVisibility) {
      switchEvmNetwork(redeemChain);
    } else {
      switchEvmNetwork(sourceInfo.chainId);
      setRedeemChain("");
    }
  }, [redeemViewVisibility, redeemChain]);

  useInterval(
    () => {
      if (
        isValidNumber(sourceInfo.tokenAmount) &&
        Number(sourceInfo.tokenAmount) > 0
      ) {
        refreshRoutes();
      }
    },
    autoRefresh ? 20000 : null
  );

  const refreshRoutes = async () => {
    try {
      await getRoutes();
    } catch (err: any) {
      console.error(err);
    }
  };

  const connection = useMemo(
    () =>
      new Connection(
        "https://twilight-powerful-river.solana-mainnet.discover.quiknode.pro/e16ed09d58ff6eb332da2aa6706c05391019a1a6/",
        {
          wsEndpoint:
            "wss://twilight-powerful-river.solana-mainnet.discover.quiknode.pro/e16ed09d58ff6eb332da2aa6706c05391019a1a6/",
          commitment: "confirmed",
        }
      ),
    []
  );

  const { data: aptosTokensList, isFetched: isAptosFetched } = useQuery(
    ["aptos-tokens-list"],
    () => getTokensAcrossAllChain(kanaChainIdList.aptos),
    {
      placeholderData: null,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: solanaTokensList } = useQuery(
    ["solana-tokens-list"],
    () => getTokensAcrossAllChain(kanaChainIdList.solana),
    {
      placeholderData: null,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: polygonTokensList } = useQuery(
    ["polygon-tokens-list"],
    () => getTokensAcrossAllChain(kanaChainIdList.polygon),
    {
      placeholderData: null,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: binanceTokensList } = useQuery(
    ["binance-tokens-list"],
    () => getTokensAcrossAllChain(kanaChainIdList.binance),
    {
      placeholderData: null,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: ethereumTokensList } = useQuery(
    ["ethereum-tokens-list"],
    () => getTokensAcrossAllChain(kanaChainIdList.ethereum),
    {
      placeholderData: null,
      staleTime: 5 * 60 * 1000,
    }
  );

  //set default tokensList
  useEffect(() => {
    if (!sourceTokenList || sourceTokenList?.length <= 0) {
      setSourceTokenList(aptosTokensList);
    }
    if (!targetTokenList || targetTokenList?.length <= 0) {
      setTargetTokenList(aptosTokensList);
    }
  }, [isAptosFetched, aptosTokensList]);

  //Tokens search functionality
  useEffect(() => {
    let chainId =
      chainAndTokenListVisibility.clickedFrom === "source"
        ? sourceInfo.chainId
        : targetInfo.chainId;
    let tokensList = [];
    switch (chainId) {
      case kanaChainIdList.solana:
        tokensList =
          solanaWalletConnected && chainId === kanaChainIdList.solana
            ? availableSolanaTokens
            : solanaTokensList;
        break;
      case kanaChainIdList.aptos:
        tokensList =
          connected && chainId === kanaChainIdList.aptos
            ? availableAptosTokens
            : aptosTokensList;
        break;
      case kanaChainIdList.polygon:
        tokensList =
          address && chainId === kanaChainIdList.polygon
            ? availablePolygonTokens
            : polygonTokensList;
        break;
      case kanaChainIdList.binance:
        tokensList = binanceTokensList ? binanceTokensList : [];
        break;
      case kanaChainIdList.ethereum:
        tokensList = ethereumTokensList ? ethereumTokensList : [];
        break;
      // case kanaChainIdList.binance:
      //   tokensList = binanceTokensList ? binanceTokensList : [];
      //   break;
      // case kanaChainIdList.ethereum:
      //   tokensList = ethereumTokensList ? ethereumTokensList : [];
      //   break;
    }

    let filteredList = (tokensList || []).filter(
      (val: any) =>
        val?.symbol.toLowerCase().includes(tokenSearchText.toLowerCase()) ||
        val?.name.toLowerCase().includes(tokenSearchText.toLowerCase()) ||
        val?.address.toLowerCase().includes(tokenSearchText.toLowerCase())
    );

    chainAndTokenListVisibility.clickedFrom === "source"
      ? setSourceTokenList(filteredList)
      : setTargetTokenList(filteredList);
  }, [tokenSearchText]);

  const redeemHash = useDebounce<string>(redeemSignature, 1500);

  useEffect(() => {
    const findRedeemChain = async () => {
      try {
        console.log(redeemChain, "redeemChain");
        const targetChainInfo = await getTargetChainFromVaa(
          redeemHash,
          redeemChain,
          provider
        );
        console.log(targetChainInfo, "targetChainInfo");

        let uiAmount = getUiAmount(
          Number(targetChainInfo.targetData.amount),
          6
        );
        let USD = solanaTokensList.find((x: any) => x.symbol === "USDC").usd;
        switch (targetChainInfo.targetChain) {
          //here chain ID refers to wormhole
          case CHAIN_ID_SOLANA:
            setRedeemData({
              ...redeemData,
              chainId: CHAIN_ID_SOLANA,
              chainImg: Solana,
              chainName: "Solana",
              tokenAmount: uiAmount,
              tokenUsd: USD,
            });
            break;

          case CHAIN_ID_APTOS:
            setRedeemData({
              ...redeemData,
              chainId: CHAIN_ID_APTOS,
              chainImg: Aptos,
              chainName: "Aptos",
              tokenAmount: uiAmount,
              tokenUsd: USD,
            });
            break;
          case CHAIN_ID_POLYGON:
            setRedeemData({
              ...redeemData,
              chainId: CHAIN_ID_POLYGON,
              chainImg: Polygon,
              chainName: "Polygon",
              tokenAmount: uiAmount,
              tokenUsd: USD,
            });
            break;
          case CHAIN_ID_BSC:
            setRedeemData({
              ...redeemData,
              chainId: CHAIN_ID_BSC,
              chainImg: Binance,
              chainName: "BSC",
              tokenAmount: uiAmount,
              tokenUsd: USD,
            });
            break;
          case CHAIN_ID_ETH:
            setRedeemData({
              ...redeemData,
              chainId: CHAIN_ID_ETH,
              chainImg: EthereumImg,
              chainName: "Ethereum",
              tokenAmount: uiAmount,
              tokenUsd: USD,
            });
            break;
        }
        setRedeemLoading(false);
      } catch {
        setRedeemData({
          ...redeemData,
          chainId: null,
          chainImg: null,
          chainName: "",
        });
        setRedeemLoading(false);
        toast.error("Enter valid address");
      }
    };
    if (redeemHash?.trim() !== "" && redeemHash) {
      findRedeemChain();
      setRedeemLoading(true);
    } else {
      setRedeemData({
        ...redeemData,
        chainId: null,
        chainImg: null,
        chainName: "",
      });
      setRedeemLoading(false);
    }
  }, [redeemChain, redeemHash]);

  //updating tokens list after changing chain
  //display tokens with balance if wallet connected
  useEffect(() => {
    if (sourceInfo.chainId === kanaChainIdList.solana) {
      availableSolanaTokens && solanaWalletConnected
        ? setSourceTokenList(availableSolanaTokens)
        : setSourceTokenList(solanaTokensList);
    } else if (sourceInfo.chainId === kanaChainIdList.aptos) {
      availableAptosTokens && connected
        ? setSourceTokenList(availableAptosTokens)
        : setSourceTokenList(aptosTokensList);
    } else if (sourceInfo.chainId === kanaChainIdList.polygon) {
      availablePolygonTokens && address
        ? setSourceTokenList(availablePolygonTokens)
        : setSourceTokenList(polygonTokensList);
    } else if (sourceInfo.chainId === kanaChainIdList.binance) {
      availableBinanceTokens && address
        ? setSourceTokenList(availableBinanceTokens)
        : setSourceTokenList(binanceTokensList);
    } else if (sourceInfo.chainId === kanaChainIdList.ethereum) {
      availableEthereumTokens && address
        ? setSourceTokenList(availableEthereumTokens)
        : setSourceTokenList(ethereumTokensList);
    }

    if (targetInfo.chainId === kanaChainIdList.solana) {
      availableSolanaTokens && solanaWalletConnected
        ? setTargetTokenList(availableSolanaTokens)
        : setTargetTokenList(solanaTokensList);
    } else if (targetInfo.chainId === kanaChainIdList.aptos) {
      availableAptosTokens && connected
        ? setTargetTokenList(availableAptosTokens)
        : setTargetTokenList(aptosTokensList);
    } else if (targetInfo.chainId === kanaChainIdList.polygon) {
      availablePolygonTokens && address
        ? setTargetTokenList(availablePolygonTokens)
        : setTargetTokenList(polygonTokensList);
    } else if (targetInfo.chainId === kanaChainIdList.binance) {
      availableBinanceTokens && address
        ? setTargetTokenList(availableBinanceTokens)
        : setTargetTokenList(binanceTokensList);
    } else if (targetInfo.chainId === kanaChainIdList.ethereum) {
      availableEthereumTokens && address
        ? setTargetTokenList(availableEthereumTokens)
        : setTargetTokenList(ethereumTokensList);
    }
    setTokenListLoading(false);
  }, [
    availableAptosTokens,
    availablePolygonTokens,
    availableSolanaTokens,
    availableBinanceTokens,
    availableEthereumTokens,
    sourceInfo.chainId,
    targetInfo.chainId,
    solanaWalletConnected,
    connected,
    address,
  ]);

  //Closing the wallet view after wallet is connected
  useEffect(() => {
    let chainId =
      walletConnectVisibility.clickedFrom === "source"
        ? sourceInfo.chainId
        : targetInfo.chainId;
    switch (chainId) {
      case kanaChainIdList.solana:
        solanaWalletConnected &&
          setWalletConnectVisibility({ visibility: false, clickedFrom: "" });
        break;
      case kanaChainIdList.aptos:
        connected &&
          setWalletConnectVisibility({ visibility: false, clickedFrom: "" });
        break;
      case kanaChainIdList.polygon:
        address &&
          setWalletConnectVisibility({ visibility: false, clickedFrom: "" });
        break;
      case kanaChainIdList.binance:
        address &&
          setWalletConnectVisibility({ visibility: false, clickedFrom: "" });
        break;
      case kanaChainIdList.ethereum:
        address &&
          setWalletConnectVisibility({ visibility: false, clickedFrom: "" });
        break;
      default:
        break;
    }
    let redeemChainId =
      redeemData.chainId === CHAIN_ID_APTOS
        ? kanaChainIdList.aptos
        : redeemData.chainId === CHAIN_ID_SOLANA
        ? kanaChainIdList.solana
        : redeemData.chainId === CHAIN_ID_POLYGON
        ? kanaChainIdList.polygon
        : redeemData.chainId === CHAIN_ID_BSC
        ? kanaChainIdList.binance
        : redeemData.chainId === CHAIN_ID_ETH
        ? kanaChainIdList.ethereum
        : 0;
    let chain =
      redeemWalletConnectVisibility.clickedFrom === "source"
        ? redeemChain
        : redeemChainId;
    switch (chain) {
      case kanaChainIdList.solana:
        setRedeemWalletConnectVisibility({
          visibility: false,
          clickedFrom: "",
        });
        break;
      case kanaChainIdList.aptos:
        setRedeemWalletConnectVisibility({
          visibility: false,
          clickedFrom: "",
        });
        break;
      case kanaChainIdList.polygon:
        setRedeemWalletConnectVisibility({
          visibility: false,
          clickedFrom: "",
        });
        break;
      case kanaChainIdList.binance:
        setRedeemWalletConnectVisibility({
          visibility: false,
          clickedFrom: "",
        });
        break;
      case kanaChainIdList.ethereum:
        setRedeemWalletConnectVisibility({
          visibility: false,
          clickedFrom: "",
        });
        break;
      default:
        break;
    }
  }, [solanaWalletConnected, connected, address]);

  let debounceAmount = useDebounce<string>(sourceInfo.tokenAmount, 1500);

  useEffect(() => {
    if (debounceAmount !== sourceInfo.tokenAmount) return;

    if (sourceInfo.tokenAmount && Number(sourceInfo.tokenAmount) != 0) {
      getRoutes();
    } else {
      setRoutesVisibility(false);
    }
    setAutoRefresh(false);

    let isSameChain = sourceInfo.chainId === targetInfo.chainId;
    //Need to implement binance after getting estimated time
    switch (sourceInfo.chainId) {
      case kanaChainIdList.solana: {
        isSameChain && setSameChainEstimationTime("~30 sec");
        targetInfo.chainId === kanaChainIdList.aptos
          ? setCrossChainEstimationTime("~3 mins")
          : targetInfo.chainId === kanaChainIdList.polygon
          ? setCrossChainEstimationTime("~5 mins")
          : targetInfo.chainId === kanaChainIdList.ethereum
          ? setCrossChainEstimationTime("~5 mins")
          : targetInfo.chainId === kanaChainIdList.binance
          ? setCrossChainEstimationTime("~5 mins")
          : setCrossChainEstimationTime("");
        break;
      }
      case kanaChainIdList.aptos: {
        isSameChain && setSameChainEstimationTime("~1 sec");
        targetInfo.chainId === kanaChainIdList.solana
          ? setCrossChainEstimationTime("~2 mins")
          : targetInfo.chainId === kanaChainIdList.polygon
          ? setCrossChainEstimationTime("~5 mins")
          : targetInfo.chainId === kanaChainIdList.ethereum
          ? setCrossChainEstimationTime("~5 mins")
          : targetInfo.chainId === kanaChainIdList.binance
          ? setCrossChainEstimationTime("~5 mins")
          : setCrossChainEstimationTime("");
        break;
      }
      case kanaChainIdList.polygon: {
        isSameChain && setSameChainEstimationTime("~1 min");
        targetInfo.chainId === kanaChainIdList.aptos
          ? setCrossChainEstimationTime("~30 mins")
          : targetInfo.chainId === kanaChainIdList.solana
          ? setCrossChainEstimationTime("~30 mins")
          : targetInfo.chainId === kanaChainIdList.ethereum
          ? setCrossChainEstimationTime("~30 mins")
          : targetInfo.chainId === kanaChainIdList.binance
          ? setCrossChainEstimationTime("~30 mins")
          : setCrossChainEstimationTime("");
        break;
      }
      case kanaChainIdList.ethereum: {
        isSameChain && setSameChainEstimationTime("~2 min");
        targetInfo.chainId === kanaChainIdList.aptos
          ? setCrossChainEstimationTime("~20 mins")
          : targetInfo.chainId === kanaChainIdList.solana
          ? setCrossChainEstimationTime("~21 mins")
          : targetInfo.chainId === kanaChainIdList.polygon
          ? setCrossChainEstimationTime("~25 mins")
          : targetInfo.chainId === kanaChainIdList.binance
          ? setCrossChainEstimationTime("~25 mins")
          : setCrossChainEstimationTime("");
        break;
      }
      case kanaChainIdList.binance: {
        isSameChain && setSameChainEstimationTime("~1 min");
        targetInfo.chainId === kanaChainIdList.aptos
          ? setCrossChainEstimationTime("~2 mins")
          : targetInfo.chainId === kanaChainIdList.solana
          ? setCrossChainEstimationTime("~3 mins")
          : targetInfo.chainId === kanaChainIdList.polygon
          ? setCrossChainEstimationTime("~5 mins")
          : targetInfo.chainId === kanaChainIdList.ethereum
          ? setCrossChainEstimationTime("~5 mins")
          : setCrossChainEstimationTime("");
        break;
      }
    }
  }, [debounceAmount, sourceInfo.tokenAddress, targetInfo.tokenAddress]);

  useEffect(() => {
    switch (sourceInfo.chainId) {
      case kanaChainIdList.solana:
        if (solanaWalletConnected) {
          updateSolanaTokenBalance(true);
          setChainAddress((chain: any) => {
            chain.sourceChainAddress = publicKey?.toBase58();
          });
        } else {
          setChainAddress((chain: any) => {
            chain.sourceChainAddress = "";
          });
          setSourceInfo((source: any) => {
            source.tokenBalance = 0;
          });
        }
        break;
      case kanaChainIdList.aptos:
        if (connected) {
          updateAptosTokenBalance(true);
          setChainAddress((chain: any) => {
            chain.sourceChainAddress = account?.address;
          });
        } else {
          setChainAddress((chain: any) => {
            chain.sourceChainAddress = "";
          });
          setSourceInfo((source: any) => {
            source.tokenBalance = 0;
          });
        }
        break;
      case kanaChainIdList.polygon:
        if ((isSocialLogin && polygon_address && isEVMConnected) || address) {
          updatePolygonTokenBalance(true);
          setChainAddress((chain: any) => {
            if (isSocialLogin) {
              chain.sourceChainAddress = polygon_address;
            } else {
              chain.sourceChainAddress = address;
            }
          });
        } else {
          setChainAddress((chain: any) => {
            chain.sourceChainAddress = "";
          });
          setSourceInfo((source: any) => {
            source.tokenBalance = 0;
          });
        }
        break;
      case kanaChainIdList.binance:
        if ((isSocialLogin && binance_address && isEVMConnected) || address) {
          updateBinanceTokenBalance(true);
          setChainAddress((chain: any) => {
            if (isSocialLogin) {
              chain.sourceChainAddress = binance_address;
            } else {
              chain.sourceChainAddress = address;
            }
          });
        } else {
          setChainAddress((chain: any) => {
            chain.sourceChainAddress = "";
          });
          setSourceInfo((source: any) => {
            source.tokenBalance = 0;
          });
        }
        break;
      case kanaChainIdList.ethereum:
        if (address) {
          updateEthereumTokenBalance(true);
          setChainAddress((chain: any) => {
            chain.sourceChainAddress = address;
          });
        } else {
          setChainAddress((chain: any) => {
            chain.sourceChainAddress = "";
          });
          setSourceInfo((source: any) => {
            source.tokenBalance = 0;
          });
        }
        break;
    }

    switch (targetInfo.chainId) {
      case kanaChainIdList.solana:
        if (solanaWalletConnected) {
          updateSolanaTokenBalance(false);
          setChainAddress((chain: any) => {
            chain.targetChainAddress = publicKey?.toBase58();
          });
        } else {
          setChainAddress((chain: any) => {
            chain.targetChainAddress = "";
          });
          setTargetInfo((target: any) => {
            target.tokenBalance = 0;
          });
        }
        break;
      case kanaChainIdList.aptos:
        if (connected) {
          updateAptosTokenBalance(false);
          setChainAddress((chain: any) => {
            chain.targetChainAddress = account?.address;
          });
        } else {
          setChainAddress((chain: any) => {
            chain.targetChainAddress = "";
          });
          setTargetInfo((target: any) => {
            target.tokenBalance = 0;
          });
        }
        break;
      case kanaChainIdList.polygon:
        if ((isSocialLogin && polygon_address && isEVMConnected) || address) {
          updatePolygonTokenBalance(false);
          setChainAddress((chain: any) => {
            if (isSocialLogin) {
              chain.targetChainAddress = polygon_address;
            } else {
              chain.targetChainAddress = address;
            }
          });
        } else {
          setChainAddress((chain: any) => {
            chain.targetChainAddress = "";
          });
          setTargetInfo((target: any) => {
            target.tokenBalance = 0;
          });
        }
        break;
      case kanaChainIdList.binance:
        if ((isSocialLogin && binance_address && isEVMConnected) || address) {
          updateBinanceTokenBalance(false);
          setChainAddress((chain: any) => {
            if (isSocialLogin) {
              chain.targetChainAddress = binance_address;
            } else {
              chain.targetChainAddress = address;
            }
          });
        } else {
          setChainAddress((chain: any) => {
            chain.targetChainAddress = "";
          });
          setTargetInfo((target: any) => {
            target.tokenBalance = 0;
          });
        }
        break;
      case kanaChainIdList.ethereum:
        if (address) {
          updateEthereumTokenBalance(false);
          setChainAddress((chain: any) => {
            chain.targetChainAddress = address;
          });
        } else {
          setChainAddress((chain: any) => {
            chain.targetChainAddress = "";
          });
          setTargetInfo((target: any) => {
            target.tokenBalance = 0;
          });
        }
        break;
    }
  }, [
    solanaWalletConnected,
    connected,
    address,
    publicKey,
    account?.address,
    account?.publicKey,
    sourceInfo.chainId,
    targetInfo.chainId,
    sourceInfo.tokenAddress,
    targetInfo.tokenAddress,
    debounceAmount,
    sameChainSwap.status,
    sourceChainSwap.status,
    targetChainSwap.status,
    polygon_address,
    setSourceInfo,
    isSocialLogin,
    setTargetInfo,
    binance_address,
  ]);

  useEffect(() => {
    if (selectedRoute) {
      if (sourceInfo.chainId === targetInfo.chainId) {
        setTargetInfo((target: any) => {
          target.tokenAmount = trimToFloor(selectedRoute.uiOutAmount, 4);
        });
      } else {
        setTargetInfo((target: any) => {
          target.tokenAmount = trimToFloor(selectedRoute.uiTargetOutAmount, 4);
        });
      }
    }
  }, [selectedRoute]);

  useEffect(() => {
    if (sourceInfo.tokenAmount && Number(sourceInfo.tokenAmount) !== 0) {
      getRoutes();
    }
  }, [slippage]);

  const updateAptosTokenBalance = async (fromSource: Boolean) => {
    try {
      let tokensList = JSON.parse(JSON.stringify(aptosTokensList));
      let res: any = await getAllAptosTokenBalance(account, tokensList);
      if (res["success"]) {
        setAvailableAptosTokens(res["data"]);
        if (fromSource) {
          let sourceToken = res["data"]?.find(
            (item: any) => item?.address === sourceInfo.tokenAddress
          );
          if (sourceToken?.balance) {
            setSourceInfo((source: any) => {
              source.tokenBalance = trimToFloor(sourceToken?.balance, 4);
            });
          }
        } else {
          let targetToken = res["data"]?.find(
            (item: any) => item?.address === targetInfo.tokenAddress
          );
          if (targetToken?.balance) {
            setTargetInfo((target: any) => {
              target.tokenBalance = trimToFloor(targetToken?.balance, 4);
            });
          }
        }
      } else {
        setAvailableAptosTokens(null);
      }
    } catch (err: any) {
      console.log("Error occurred in updateAptosTokenBalance::", err);
      setAvailableAptosTokens(null);
    }
  };

  const updateSolanaTokenBalance = async (fromSource: Boolean) => {
    try {
      let tokensList = JSON.parse(JSON.stringify(solanaTokensList));
      //@ts-ignore
      let res: any = await getAllSolanaTokenBalance(publicKey, tokensList);
      if (res["success"]) {
        setAvailableSolanaTokens(res["data"]);
        if (fromSource) {
          let sourceToken = res["data"]?.find(
            (item: any) => item?.address === sourceInfo.tokenAddress
          );
          if (sourceToken) {
            setSourceInfo((source: any) => {
              source.tokenBalance = trimToFloor(
                sourceToken?.balance.uiAmount,
                4
              );
            });
          }
        } else {
          let targetToken = res["data"]?.find(
            (item: any) => item?.address === targetInfo.tokenAddress
          );
          if (targetToken) {
            setTargetInfo((target: any) => {
              target.tokenBalance = trimToFloor(
                targetToken?.balance.uiAmount,
                4
              );
            });
          }
        }
      } else {
        setAvailableSolanaTokens(null);
      }
    } catch (err: any) {
      console.log("Error occurred in updateSolanaTokenBalance", err);
      setAvailableSolanaTokens(null);
    }
  };

  const updatePolygonTokenBalance = async (fromSource: Boolean) => {
    try {
      let tokensList1 = JSON.parse(JSON.stringify(polygonTokensList));
      let evm_address = address ? address : polygon_address;
      let res = await getAllEVMTokenBalance(
        evm_address,
        tokensList1,
        kanaChainIdList.polygon
      );
      if (res["success"]) {
        console.log(res["data"], "res['data']");
        setAvailablePolygonTokens(res["data"]);
        if (fromSource) {
          let sourceToken = res["data"]?.find(
            (item: any) =>
              String(item?.address).toLowerCase() ===
              String(sourceInfo.tokenAddress).toLowerCase()
          );
          if (sourceToken) {
            setSourceInfo((source: any) => {
              source.tokenBalance = trimToFloor(sourceToken?.uiAmountString, 4);
            });
          }
        } else {
          let targetToken = res["data"]?.find(
            (item: any) =>
              String(item?.address).toLowerCase() ===
              String(targetInfo.tokenAddress).toLowerCase()
          );
          if (targetToken) {
            setTargetInfo((target: any) => {
              target.tokenBalance = trimToFloor(targetToken?.uiAmountString, 4);
            });
          }
        }
      } else {
        setAvailablePolygonTokens(null);
      }
    } catch (err) {
      console.log("Error occurred in updatePolygonTokenBalance ::", err);
      setAvailablePolygonTokens(null);
    }
  };

  const updateBinanceTokenBalance = async (fromSource: Boolean) => {
    try {
      let tokensList1 = JSON.parse(JSON.stringify(binanceTokensList));
      let evm_address = address ? address : binance_address;
      let res = await getAllEVMTokenBalance(
        evm_address,
        tokensList1,
        kanaChainIdList.binance
      );
      if (res["success"]) {
        setAvailableBinanceTokens(res["data"]);
        if (fromSource) {
          let sourceToken = res["data"]?.find(
            (item: any) =>
              String(item?.address).toLowerCase() ===
              String(sourceInfo.tokenAddress).toLowerCase()
          );
          if (sourceToken) {
            setSourceInfo((source: any) => {
              source.tokenBalance = trimToFloor(sourceToken?.uiAmountString, 4);
            });
          }
        } else {
          let targetToken = res["data"]?.find(
            (item: any) =>
              String(item?.address).toLowerCase() ===
              String(targetInfo.tokenAddress).toLowerCase()
          );
          if (targetToken) {
            setTargetInfo((target: any) => {
              target.tokenBalance = trimToFloor(targetToken?.uiAmountString, 4);
            });
          }
        }
      } else {
        setAvailableBinanceTokens(null);
      }
    } catch (err: any) {
      console.log("Error occurred in updateBinanceTokenBalance ::", err);
      setAvailableBinanceTokens(null);
    }
  };

  const updateEthereumTokenBalance = async (fromSource: Boolean) => {
    try {
      let tokensList1 = JSON.parse(JSON.stringify(ethereumTokensList));
      let res = await getAllEVMTokenBalance(
        address,
        tokensList1,
        kanaChainIdList.ethereum
      );
      if (res["success"]) {
        setAvailableEthereumTokens(res["data"]);
        if (fromSource) {
          let sourceToken = res["data"]?.find(
            (item: any) =>
              String(item?.address).toLowerCase() ===
              String(sourceInfo.tokenAddress).toLowerCase()
          );
          if (sourceToken) {
            setSourceInfo((source: any) => {
              source.tokenBalance = trimToFloor(sourceToken?.uiAmountString, 4);
            });
          }
        } else {
          let targetToken = res["data"]?.find(
            (item: any) =>
              String(item?.address).toLowerCase() ===
              String(targetInfo.tokenAddress).toLowerCase()
          );
          if (targetToken) {
            setTargetInfo((target: any) => {
              target.tokenBalance = trimToFloor(targetToken?.uiAmountString, 4);
            });
          }
        }
      } else {
        setAvailableEthereumTokens(null);
      }
    } catch (err: any) {
      console.log("Error occurred in updateEthereumTokenBalance ::", err);
      setAvailableEthereumTokens(null);
    }
  };

  const calculateUIValues = useCallback(
    async (routes: any) => {
      try {
        if (sourceInfo.chainId === kanaChainIdList.solana) {
          let dec = await getTokenDecimals(
            connection,
            new PublicKey(routes[0].outputTokenAddress)
          );
          let token: any = solanaTokensList?.find(
            (x: any) => x?.address === routes[0].outputTokenAddress
          );
          routes.map(async (route: any) => {
            let uiAmount = getUiAmount(Number(route.outputValue), dec);
            route.uiOutAmount = uiAmount;
            route.dollarPrice = token.usd * uiAmount;
            route.uiKanaFee = getUiAmount(Number(route.kanaFee), dec);
          });
        } else if (sourceInfo.chainId === kanaChainIdList.aptos) {
          let token = aptosTokensList?.find(
            (x: any) => x.address === targetInfo?.tokenAddress
          );
          let dec = token?.decimals;
          routes.map(async (route: any) => {
            route.uiOutAmount = getUiAmount(Number(route.outputValue), dec);
            route.uiExpectedAmount = getUiAmount(
              Number(route.expectedAmount),
              dec
            );
            route.uiMinimumReceivedAmount = getUiAmount(
              Number(route.minimumReceivedAmount),
              dec
            );
            route.uiIntegratorFee = getUiAmount(
              Number(route.integratorFee),
              dec
            );
            route.uiKanaFee = getUiAmount(Number(route.kanaFee), dec);
            route.dollarPrice =
              token.usd * getUiAmount(Number(route.outputValue), dec);
          });
        } else if (sourceInfo.chainId === kanaChainIdList.polygon) {
          let token = polygonTokensList?.find(
            (x: any) =>
              String(x?.address.toLowerCase()) ===
              String(targetInfo?.tokenAddress).toLowerCase()
          );
          let dec = token?.decimals;
          routes.map(async (route: any) => {
            route.uiOutAmount = getUiAmount(Number(route.outputValue), dec);
            route.uiExpectedAmount = getUiAmount(
              Number(route.expectedAmount),
              dec
            );
            route.uiMinimumReceivedAmount = getUiAmount(
              Number(route.minimumReceivedAmount),
              dec
            );
            // route.uiIntegratorFee = getUiAmount(Number(route.integratorFee), dec);
            // route.uiKanaFee = getUiAmount(Number(route.kanaFee), dec);
            route.dollarPrice =
              token?.usd * getUiAmount(Number(route.outputValue), dec);
          });
        } else if (sourceInfo.chainId === kanaChainIdList.binance) {
          let token = binanceTokensList?.find(
            (x: any) =>
              String(x?.address.toLowerCase()) ===
              String(targetInfo?.tokenAddress).toLowerCase()
          );
          let dec = token?.decimals;
          routes.map(async (route: any) => {
            route.uiOutAmount = getUiAmount(Number(route.outputValue), dec);
            route.uiExpectedAmount = getUiAmount(
              Number(route.expectedAmount),
              dec
            );
            route.uiMinimumReceivedAmount = getUiAmount(
              Number(route.minimumReceivedAmount),
              dec
            );
            // route.uiIntegratorFee = getUiAmount(Number(route.integratorFee), dec);
            // route.uiKanaFee = getUiAmount(Number(route.kanaFee), dec);
            route.dollarPrice =
              token?.usd * getUiAmount(Number(route.outputValue), dec);
          });
        } else if (sourceInfo.chainId === kanaChainIdList.ethereum) {
          let token = ethereumTokensList?.find(
            (x: any) =>
              String(x?.address.toLowerCase()) ===
              String(targetInfo?.tokenAddress).toLowerCase()
          );
          let dec = token?.decimals;
          routes.map(async (route: any) => {
            route.uiOutAmount = getUiAmount(Number(route.outputValue), dec);
            route.uiExpectedAmount = getUiAmount(
              Number(route.expectedAmount),
              dec
            );
            route.uiMinimumReceivedAmount = getUiAmount(
              Number(route.minimumReceivedAmount),
              dec
            );
            // route.uiIntegratorFee = getUiAmount(Number(route.integratorFee), dec);
            // route.uiKanaFee = getUiAmount(Number(route.kanaFee), dec);
            route.dollarPrice =
              token?.usd * getUiAmount(Number(route.outputValue), dec);
          });
        } else if (sourceInfo.chainId === kanaChainIdList.binance) {
          let token = binanceTokensList?.find(
            (x: any) =>
              String(x?.address.toLowerCase()) ===
              String(targetInfo?.tokenAddress).toLowerCase()
          );
          let dec = token?.decimals;
          routes.map(async (route: any) => {
            route.uiOutAmount = getUiAmount(Number(route.outputValue), dec);
            route.uiExpectedAmount = getUiAmount(
              Number(route.expectedAmount),
              dec
            );
            route.uiMinimumReceivedAmount = getUiAmount(
              Number(route.minimumReceivedAmount),
              dec
            );
            // route.uiIntegratorFee = getUiAmount(Number(route.integratorFee), dec);
            // route.uiKanaFee = getUiAmount(Number(route.kanaFee), dec);
            route.dollarPrice =
              token?.usd * getUiAmount(Number(route.outputValue), dec);
          });
        } else if (sourceInfo.chainId === kanaChainIdList.ethereum) {
          let token = ethereumTokensList?.find(
            (x: any) =>
              String(x?.address.toLowerCase()) ===
              String(targetInfo?.tokenAddress).toLowerCase()
          );
          let dec = token?.decimals;
          routes.map(async (route: any) => {
            route.uiOutAmount = getUiAmount(Number(route.outputValue), dec);
            route.uiExpectedAmount = getUiAmount(
              Number(route.expectedAmount),
              dec
            );
            route.uiMinimumReceivedAmount = getUiAmount(
              Number(route.minimumReceivedAmount),
              dec
            );
            // route.uiIntegratorFee = getUiAmount(Number(route.integratorFee), dec);
            // route.uiKanaFee = getUiAmount(Number(route.kanaFee), dec);
            route.dollarPrice =
              token?.usd * getUiAmount(Number(route.outputValue), dec);
          });
        }
        return routes;
      } catch (error) {
        console.log("Error occurred in calculateUIValues::" + error);
      }
    },
    [
      sourceInfo,
      targetInfo,
      connection,
      solanaTokensList,
      aptosTokensList,
      polygonTokensList,
      binanceTokensList,
    ]
  );

  const getSourceTokenDecimals = () => {
    let tokenList;
    switch (sourceInfo.chainId) {
      case kanaChainIdList.aptos:
        tokenList = aptosTokensList;
        break;
      case kanaChainIdList.solana:
        tokenList = solanaTokensList;
        break;
      case kanaChainIdList.polygon:
        tokenList = polygonTokensList;
        break;
      case kanaChainIdList.binance:
        tokenList = binanceTokensList;
        break;
      case kanaChainIdList.ethereum:
        tokenList = ethereumTokensList;
        break;
      default:
        break;
    }
    const decimal = tokenList?.find(
      (x: any) =>
        String(x.address)?.toLowerCase() ===
        String(sourceInfo?.tokenAddress)?.toLowerCase()
    )?.decimals;
    return decimal;
  };

  const interchangeSwap = () => {
    setAllowInterChange(false);
    setTimeout(() => {
      setAllowInterChange(true);
    }, 1000);
    const temp = { ...sourceInfo };
    setSourceInfo({
      ...targetInfo,
    });
    setTargetInfo({
      ...temp,
    });
    if (sourceInfo.tokenAmount > 0) {
      setRouteLoading(true);
    }
  };

  const copyHash = useCallback(
    async (hash: any) => {
      await navigator.clipboard.writeText(hash);
    },
    [sameChainSwap.hash, sourceChainSwap.hash, targetChainSwap.hash]
  );

  const calculateUICrossChainValues = useCallback(
    async (route: any, routeChainId: any) => {
      if (routeChainId === kanaChainIdList.solana) {
        let dec = await getTokenDecimals(
          connection,
          new PublicKey(route.outputTokenAddress)
        );
        let outputToken = solanaTokensList?.find(
          (x: any) => x?.address === route.outputTokenAddress
        );

        route.uiOutAmount = getUiAmount(Number(route.outputValue), dec);
        route.dollarPrice = outputToken?.usd * route.uiOutAmount;
        route.uiKanaFee = getUiAmount(route.kanaFee, dec);
        return route;
      } else if (routeChainId === kanaChainIdList.aptos) {
        let outputToken = aptosTokensList.find(
          (x: any) => x.address === route.outputTokenAddress
        );
        let dec = outputToken?.decimals;
        //@ts-ignore
        route.uiOutAmount = getUiAmount(Number(route.outputValue), dec);
        route.uiExpectedAmount = getUiAmount(Number(route.expectedAmount), dec);
        route.uiMinimumReceivedAmount = getUiAmount(
          Number(route.minimumReceivedAmount),
          dec
        );
        route.uiIntegratorFee = getUiAmount(Number(route.integratorFee), dec);
        route.uiKanaFee = getUiAmount(Number(route.kanaFee), dec);
        route.dollarPrice =
          outputToken?.usd * getUiAmount(Number(route.outputValue), dec);
        return route;
      } else if (routeChainId === kanaChainIdList.polygon) {
        console.log(routeChainId, route.outputTokenAddress, "routeChainId");
        let token = polygonTokensList?.find(
          (x: any) =>
            String(x?.address.toLowerCase()) ===
            String(route.outputTokenAddress).toLowerCase()
        );
        let dec = token?.decimals;

        console.log(token, "token");

        route.uiOutAmount = getUiAmount(Number(route.outputValue), dec);
        route.uiExpectedAmount = getUiAmount(Number(route.expectedAmount), dec);
        route.uiMinimumReceivedAmount = getUiAmount(
          Number(route.minimumReceivedAmount),
          dec
        );
        route.uiIntegratorFee = getUiAmount(Number(route.integratorFee), dec);
        route.uiKanaFee = getUiAmount(Number(route.kanaFee), dec);
        route.dollarPrice =
          token?.usd * getUiAmount(Number(route.outputValue), dec);
        return route;
      } else if (routeChainId === kanaChainIdList.binance) {
        let token = binanceTokensList?.find(
          (x: any) =>
            String(x?.address.toLowerCase()) ===
            String(route.outputTokenAddress).toLowerCase()
        );
        let dec = token?.decimals;

        console.log(token, "token");

        route.uiOutAmount = getUiAmount(Number(route.outputValue), dec);
        route.uiExpectedAmount = getUiAmount(Number(route.expectedAmount), dec);
        route.uiMinimumReceivedAmount = getUiAmount(
          Number(route.minimumReceivedAmount),
          dec
        );
        route.uiIntegratorFee = getUiAmount(Number(route.integratorFee), dec);
        route.uiKanaFee = getUiAmount(Number(route.kanaFee), dec);
        route.dollarPrice =
          token?.usd * getUiAmount(Number(route.outputValue), dec);
        return route;
      } else if (routeChainId === kanaChainIdList.ethereum) {
        let token = ethereumTokensList?.find(
          (x: any) =>
            String(x?.address.toLowerCase()) ===
            String(route.outputTokenAddress).toLowerCase()
        );
        let dec = token?.decimals;

        route.uiOutAmount = getUiAmount(Number(route.outputValue), dec);
        route.uiExpectedAmount = getUiAmount(Number(route.expectedAmount), dec);
        route.uiMinimumReceivedAmount = getUiAmount(
          Number(route.minimumReceivedAmount),
          dec
        );
        route.uiIntegratorFee = getUiAmount(Number(route.integratorFee), dec);
        route.uiKanaFee = getUiAmount(Number(route.kanaFee), dec);
        route.dollarPrice =
          token?.usd * getUiAmount(Number(route.outputValue), dec);
        return route;
      }
    },
    [connection, solanaTokensList, aptosTokensList, polygonTokensList]
  );

  const getRoutes = async () => {
    try {
      setRouteLoading(true);
      let tokenDecimalAmount = 0;
      let decimal = getSourceTokenDecimals();
      tokenDecimalAmount = Number(sourceInfo.tokenAmount) * 10 ** decimal;
      let directRoute =
        sourceInfo.chainId === kanaChainIdList.solana ? false : false;

      if (sourceInfo.chainId === targetInfo.chainId) {
        let res = await getSwapQuote(
          "IaXtxTgompESxFXBKSlHsEfnJTtdyV",
          sourceInfo.chainId,
          sourceInfo.tokenAddress.trim(),
          targetInfo.tokenAddress.trim(),
          BigInt(Math.floor(tokenDecimalAmount)) as any,
          slippage,
          undefined,
          directRoute,
          undefined,
          undefined,
          Environment.DEV
        );
        const routes = res.data;
        if (routes && routes?.length !== 0) {
          let structuredRoutes: any;
          if (sourceInfo.chainId === kanaChainIdList.solana) {
            // await calculateDecimals(sourceInfo.tokenAddress);
            const structuredArr = await getSolanaStructuredRoutes(
              routes,
              solanaTokensList
            );
            structuredRoutes = await calculateUIValues(structuredArr);
          } else if (sourceInfo.chainId === kanaChainIdList.aptos) {
            const structuredArr = await getAptosStructuredRoutes(
              routes,
              aptosTokensList
            );
            structuredRoutes = await calculateUIValues(structuredArr);
          } else if (sourceInfo.chainId === kanaChainIdList.polygon) {
            const structuredArr = await getEvmStructuredRoutes(
              routes,
              polygonTokensList
            );
            structuredRoutes = await calculateUIValues(structuredArr);
          } else if (sourceInfo.chainId === kanaChainIdList.binance) {
            const structuredArr = await getEvmStructuredRoutes(
              routes,
              binanceTokensList
            );
            structuredRoutes = await calculateUIValues(structuredArr);
          } else if (sourceInfo.chainId === kanaChainIdList.ethereum) {
            const structuredArr = await getEvmStructuredRoutes(
              routes,
              ethereumTokensList
            );
            console.log(structuredArr, "structuredArr");
            structuredRoutes = await calculateUIValues(structuredArr);
          }
          setAvailableRoutes(structuredRoutes);
          setSelectedRoute(structuredRoutes[0]);
          setRoutesVisibility(true);
          setRouteLoading(false);
          setAutoRefresh(true);
        } else {
          throw "No routes available";
        }
      } else {
        const res = await getQuotesforCrossChainSwap(
          "IaXtxTgompESxFXBKSlHsEfnJTtdyV",
          sourceInfo.chainId,
          targetInfo.chainId,
          sourceInfo.tokenAddress.trim(),
          targetInfo.tokenAddress.trim(),
          BigInt(Math.floor(tokenDecimalAmount)) as any,
          slippage, //Slippage percent
          1,
          undefined,
          Environment.DEV
        );

        let routes: any = res.data;
        if (routes && routes?.length !== 0) {
          routes.map(async (route: any, index: any) => {
            if (isObjectNonEmpty(route)) {
              let solTokenDecimals: any = (solanaTokensList || [])?.find(
                (x: any) =>
                  x.address === "So11111111111111111111111111111111111111112"
              )?.decimals;
              let aptosTokenDecimals: any = (aptosTokensList || [])?.find(
                (x: any) => x.address === "0x1::aptos_coin::AptosCoin"
              )?.decimals;
              let polygonTokenDecimals: any = (polygonTokensList || []).find(
                (x: any) =>
                  String(x.address).toLowerCase() ===
                  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
              )?.decimals;
              let binanceTokenDecimals: any = (binanceTokensList || []).find(
                (x: any) =>
                  String(x.address).toLowerCase() ===
                  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
              )?.decimals;
              let ethereumTokenDecimals: any = (ethereumTokensList || []).find(
                (x: any) =>
                  String(x.address).toLowerCase() ===
                  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
              )?.decimals;

              //Source chain details
              let sourceTokenList;
              let sourceTokenDecimals;
              let sourceChainSymbol;
              let kanaBridgeFeeSymbol;
              switch (route.sourceChainID) {
                case kanaChainIdList.solana:
                  sourceTokenList = solanaTokensList;
                  sourceTokenDecimals = solTokenDecimals;
                  sourceChainSymbol = " SOL";
                  kanaBridgeFeeSymbol = " USDC";
                  break;
                case kanaChainIdList.aptos:
                  sourceTokenList = aptosTokensList;
                  sourceTokenDecimals = aptosTokenDecimals;
                  sourceChainSymbol = " APT";
                  kanaBridgeFeeSymbol = " USDCso";
                  break;
                case kanaChainIdList.polygon:
                  sourceTokenList = polygonTokensList;
                  sourceTokenDecimals = polygonTokenDecimals;
                  sourceChainSymbol = " MATIC";
                  kanaBridgeFeeSymbol = " USDC";
                  break;
                case kanaChainIdList.binance:
                  sourceTokenList = binanceTokensList;
                  sourceTokenDecimals = binanceTokenDecimals;
                  sourceChainSymbol = "BNB";
                  kanaBridgeFeeSymbol = " USDC";
                  break;
                case kanaChainIdList.ethereum:
                  sourceTokenList = ethereumTokensList;
                  sourceTokenDecimals = ethereumTokenDecimals;
                  sourceChainSymbol = "ETH";
                  kanaBridgeFeeSymbol = " USDC";
                  break;
                default:
                  break;
              }

              let decimals: any = (sourceTokenList || [])?.find(
                (x: any) => x?.address === route?.sourceBridgeToken
              )?.decimals;

              route["index"] = index;
              route["sourceGasEstimationUIAmount"] =
                trimToFloor(
                  getUiAmount(
                    Number(route.sourceGasEstimation),
                    sourceTokenDecimals
                  ),
                  4
                ) + sourceChainSymbol;
              route["bridgeUIAmount"] = trimToFloor(
                getUiAmount(
                  Number(route.bridgeAmount),
                  decimals ? decimals : 6
                ),
                4
              );
              route["kanaBridgeFee"] =
                trimToFloor(
                  getUiAmount(
                    Number(route.kanaBridgeFee),
                    decimals ? decimals : 6
                  ),
                  4
                ) + kanaBridgeFeeSymbol;
              route["sourceBridgeTokenSymbol"] =
                route.sourceChainID === kanaChainIdList.polygon
                  ? "USDCpol"
                  : (sourceTokenList || [])?.find(
                      (x: any) =>
                        String(x.address).toLowerCase() ===
                        route.sourceBridgeToken.toLowerCase()
                    )?.symbol;

              //Target chain details
              let targetChainSymbol;
              let targetTokenDecimals;
              let targetTokenList;
              switch (route.targetChainID) {
                case kanaChainIdList.solana:
                  targetChainSymbol = " SOL";
                  targetTokenDecimals = solTokenDecimals;
                  targetTokenList = solanaTokensList;
                  break;
                case kanaChainIdList.aptos:
                  targetChainSymbol = " APT";
                  targetTokenDecimals = aptosTokenDecimals;
                  targetTokenList = aptosTokensList;
                  break;
                case kanaChainIdList.polygon:
                  targetChainSymbol = " MATIC";
                  targetTokenDecimals = polygonTokenDecimals;
                  targetTokenList = polygonTokensList;
                  break;
                case kanaChainIdList.binance:
                  targetChainSymbol = " BNB";
                  targetTokenDecimals = binanceTokenDecimals;
                  targetTokenList = binanceTokensList;
                  break;
                case kanaChainIdList.ethereum:
                  targetChainSymbol = " ETH";
                  targetTokenDecimals = ethereumTokenDecimals;
                  targetTokenList = ethereumTokensList;
                  break;
                default:
                  break;
              }
              console.log(
                Number(route.targetGasEstimation),
                targetTokenDecimals,
                "targetGasEstimation"
              );

              let targetToken = targetTokenList?.find(
                (x: any) => x?.address === route.targetToken
              );

              route["targetGasEstimationUIAmount"] =
                trimToFloor(
                  getUiAmount(
                    Number(route.targetGasEstimation),
                    targetTokenDecimals
                  ),
                  4
                ) + targetChainSymbol;
              route["targetBridgeTokenSymbol"] =
                route.targetChainID === kanaChainIdList.polygon
                  ? "USDCpol"
                  : (targetTokenList || [])?.find(
                      (x: any) =>
                        String(x?.address).toLowerCase() ===
                        route.targetBridgeToken.toLowerCase()
                    )?.symbol;
              route["uiTargetOutAmount"] = trimToFloor(
                getUiAmount(Number(route.outAmount), targetToken?.decimals),
                4
              );
              route["uiTargetDollarPrice"] =
                targetToken?.usd * route.uiTargetOutAmount;

              if (isObjectNonEmpty(route.sourceRoute)) {
                let structuredRoute1;
                if (route.sourceChainID === kanaChainIdList.aptos) {
                  structuredRoute1 = await getCrossChainAptosRoute(
                    route.sourceRoute,
                    aptosTokensList
                  );
                } else if (route.sourceChainID === kanaChainIdList.solana) {
                  // await calculateDecimals(token2AddressTemp);
                  structuredRoute1 = await getCrossChainSolanaRoute(
                    route.sourceRoute,
                    solanaTokensList
                  );
                } else if (route.sourceChainID === kanaChainIdList.polygon) {
                  structuredRoute1 = await getCrossChainEvmRoute(
                    route.sourceRoute,
                    polygonTokensList
                  );
                } else if (route.sourceChainID === kanaChainIdList.binance) {
                  structuredRoute1 = await getCrossChainEvmRoute(
                    route.sourceRoute,
                    binanceTokensList
                  );
                } else if (route.sourceChainID === kanaChainIdList.ethereum) {
                  structuredRoute1 = await getCrossChainEvmRoute(
                    route.sourceRoute,
                    ethereumTokensList
                  );
                }
                const structuredRoute = await calculateUICrossChainValues(
                  structuredRoute1,
                  route.sourceChainID
                );
                setSourceChainRoute(structuredRoute);
              } else {
                setSourceChainRoute(null);
              }
              if (isObjectNonEmpty(route.targetRoute)) {
                let structuredRoute1;
                if (route.targetChainID === kanaChainIdList.aptos) {
                  structuredRoute1 = await getCrossChainAptosRoute(
                    route.targetRoute,
                    aptosTokensList
                  );
                } else if (route.targetChainID === kanaChainIdList.solana) {
                  // await calculateDecimals(token2AddressTemp);
                  structuredRoute1 = await getCrossChainSolanaRoute(
                    route.targetRoute,
                    solanaTokensList
                  );
                } else if (route.targetChainID === kanaChainIdList.polygon) {
                  structuredRoute1 = await getCrossChainEvmRoute(
                    route.targetRoute,
                    polygonTokensList
                  );
                } else if (route.targetChainID === kanaChainIdList.binance) {
                  structuredRoute1 = await getCrossChainEvmRoute(
                    route.targetRoute,
                    binanceTokensList
                  );
                } else if (route.targetChainID === kanaChainIdList.ethereum) {
                  structuredRoute1 = await getCrossChainEvmRoute(
                    route.targetRoute,
                    ethereumTokensList
                  );
                }
                const structuredRoute = await calculateUICrossChainValues(
                  structuredRoute1,
                  route.targetChainID
                );
                setTargetChainRoute(structuredRoute);
              } else {
                setTargetChainRoute(null);
              }
              setCrossChainRoutes(routes);
              setSelectedRoute(routes[0]);
              setRoutesVisibility(true);
              setRouteLoading(false);
            }
          });
        } else {
          throw "No routes available";
        }
      }
    } catch (error: any) {
      console.log("Error occurred in getRoutes::" + error);
      setRoutesVisibility(false);
      setRouteLoading(false);
      if (
        error?.message?.toString() == "Internal Server Error" ||
        error?.message?.toString() == "Service Unavailable"
      ) {
        toast.error("Failed to get quote, Please try again");
        setSourceInfo((source: any) => {
          source.tokenAmount = "";
        });
        setTargetInfo((target: any) => {
          target.tokenAmount = "";
        });
        return;
      } else {
        toast.error(error?.message ? error?.message.toString() : error);
      }
    } finally {
      setAutoRefresh(true);
    }
  };

  const onTokenAmountChange = (e: any) => {
    let value: any = e.target.value;
    // only accept digit . and numbers
    if (
      /^[0-9\.]*$/gm.test(value) &&
      ((value.match(/[\.,]/gm) &&
        value.match(/^[0-9]{0,9}(\.|,)?[0-9]{0,8}$/gm)) ||
        (!value.match(/[\.,]/gm) &&
          value.match(/^[0-9]{0,9}$/gm) &&
          (!value.match(/\./gm) || value.match(/\./gm)?.length <= 1) &&
          (!value.match(/,/gm) || value.match(/,/gm)?.length <= 1)))
    ) {
      // replace duplication if needed
      const amount = value
        .replace(/\.+/gm, ".")
        .replace(/,+/gm, ",")
        .replace(/^0+/gm, "0")
        // if first character is . then replace them with 0.
        .replace(/^\./, "0.");
      setSourceInfo((source: any) => {
        source.tokenAmount = amount;
      });
      // console.log("MMM")
      setRouteLoading(true);
      if (Number(amount) <= 0) {
        setRoutesVisibility(false);
        setRouteLoading(false);
        setTargetInfo((target: any) => {
          target.tokenAmount = "";
        });
      }
    }
  };

  const displayTokenList = (value: string) => {
    setChainAndTokenListVisibility({ visibility: true, clickedFrom: value });
  };

  const onTokenSearchTextChange = (e: any) => {
    let value = e.target.value;
    if (value.trim() !== "") {
      setTokenSearchText(e.target.value);
    } else {
      setTokenSearchText("");
    }
  };

  const onWalletSearchTextChange = (e: any) => {
    let value = e.target.value;
    if (value.trim() !== "") {
      setWalletSearchText(e.target.value);
    } else {
      setWalletSearchText("");
    }
  };

  const selectChain = (chainId: number) => {
    let chainImg = "";
    let chainName = "";
    let primaryToken: any;
    let secondaryToken: any;
    switch (chainId) {
      case kanaChainIdList.solana:
        chainImg = Solana;
        chainName = "Solana";
        primaryToken = SOLANA_TOKEN_1;
        secondaryToken = SOLANA_TOKEN_2;
        break;
      case kanaChainIdList.aptos:
        chainImg = Aptos;
        chainName = "Aptos";
        primaryToken = APTOS_TOKEN_1;
        secondaryToken = APTOS_TOKEN_2;
        break;
      case kanaChainIdList.polygon:
        chainImg = Polygon;
        chainName = "Polygon";
        primaryToken = POLYGON_TOKEN_1;
        secondaryToken = POLYGON_TOKEN_2;
        setChain(EVM_CHAIN_ID.POLYGON);
        break;
      case kanaChainIdList.binance:
        chainImg = Binance;
        chainName = "BSC";
        primaryToken = BINANCE_TOKEN_1;
        secondaryToken = BINANCE_TOKEN_2;
        setChain(EVM_CHAIN_ID.BINANCE);
        break;
      case kanaChainIdList.ethereum:
        chainImg = EthereumImg;
        chainName = "Ethereum";
        primaryToken = ETHEREUM_TOKEN_1;
        secondaryToken = ETHEREUM_TOKEN_2;
        setChain(EVM_CHAIN_ID.ETHEREUM);
        break;
    }

    const setSourceChainAndTokenList = async () => {
      //If they click same value again do nothing
      if (!(sourceInfo.chainId === chainId)) {
        //Network switch when changing source chain
        if (chainId === kanaChainIdList.polygon && chain?.id !== 137) {
          network?.switchNetworkAsync &&
            (await network?.switchNetworkAsync(137));
          provider = getProvider();
          // const signer = await fetchSigner()
          // console.log(provider,"polygon", signer);
        } else if (chainId === kanaChainIdList.binance && chain?.id !== 56) {
          network?.switchNetworkAsync &&
            (await network?.switchNetworkAsync(56));
          provider = getProvider();
          // const signer = await fetchSigner()
          // console.log(provider,"binance",signer);
        } else if (chainId === kanaChainIdList.ethereum && chain?.id !== 1) {
          network?.switchNetworkAsync && (await network?.switchNetworkAsync(1));
          provider = getProvider();
          // const signer = await fetchSigner()
          // console.log(provider,"ethereum",signer);
        }
        setTokenSearchText("");
        setTokenListLoading(true);
        let symbol: string, address: string, imgURI: string;
        if (
          targetInfo.chainId === chainId &&
          targetInfo.tokenSymbol === primaryToken.symbol
        ) {
          symbol = secondaryToken.symbol;
          address = secondaryToken.address;
          imgURI = secondaryToken.logoURI;
        } else {
          symbol = primaryToken?.symbol;
          address = primaryToken?.address;
          imgURI = primaryToken?.logoURI;
        }
        setSourceInfo((source: any) => {
          source.chainId = chainId;
          source.chainImg = chainImg;
          source.chainName = chainName;
          source.tokenSymbol = symbol;
          source.tokenImg = imgURI;
          source.tokenAddress = address;
          source.tokenBalance = 0;
          source.tokenAmount = "";
        });
        setTargetInfo((target: any) => {
          target.tokenAmount = "";
        });
        setRoutesVisibility(false);
      }
    };

    const setTargetChainAndTokenList = () => {
      //If they click same value again do nothing
      if (!(targetInfo.chainId === chainId)) {
        setTokenListLoading(true);
        setTokenSearchText("");
        let symbol: string, address: string, imgURI: string;
        if (
          sourceInfo.chainId === chainId &&
          sourceInfo.tokenSymbol === primaryToken.symbol
        ) {
          symbol = secondaryToken.symbol;
          address = secondaryToken.address;
          imgURI = secondaryToken.logoURI;
        } else {
          symbol = primaryToken.symbol;
          address = primaryToken.address;
          imgURI = primaryToken.logoURI;
        }
        setTargetInfo((target: any) => {
          target.chainId = chainId;
          target.chainImg = chainImg;
          target.chainName = chainName;
          target.tokenSymbol = symbol;
          target.tokenImg = imgURI;
          target.tokenAddress = address;
          target.tokenBalance = 0;
          target.tokenAmount = "";
        });
        setSourceInfo((source: any) => {
          source.tokenAmount = "";
        });
        setRoutesVisibility(false);
      }
    };

    chainAndTokenListVisibility.clickedFrom === "source"
      ? setSourceChainAndTokenList()
      : setTargetChainAndTokenList();
  };

  const updateTokenSelect = (token: any) => {
    try {
      const updateSourceToken = () => {
        if (!(token.address === sourceInfo.tokenAddress)) {
          setSourceInfo((source: any) => {
            source.tokenSymbol = token.symbol;
            source.tokenImg = token.logoURI;
            source.tokenAddress = token.address;
            source.tokenBalance = 0;
          });
          setTargetInfo((target: any) => {
            target.tokenAmount = "";
          });
        }
      };
      const updateTargetToken = () => {
        if (!(token.address === targetInfo.tokenAddress)) {
          setTargetInfo((target: any) => {
            target.tokenSymbol = token.symbol;
            target.tokenImg = token.logoURI;
            target.tokenAddress = token.address;
            target.tokenAmount = "";
            target.tokenBalance = 0;
          });
        }
      };
      chainAndTokenListVisibility.clickedFrom === "source"
        ? updateSourceToken()
        : updateTargetToken();

      setChainAndTokenListVisibility({
        ...chainAndTokenListVisibility,
        visibility: false,
      });
      setRoutesVisibility(false);
      //clearing token search text after selecting
      setTokenSearchText("");
    } catch (error: any) {
      console.log("Error occurred in updateTokenSelect::" + error);
    }
  };

  const checkSourceTokenBalance = (tokenBalance: any) => {
    if (
      tokenBalance === null ||
      tokenBalance === 0 ||
      tokenBalance < Number(sourceInfo.tokenAmount)
    ) {
      toast.error(`Insufficient ${sourceInfo.tokenSymbol} balance`);
      return false;
    } else {
      return true;
    }
  };

  const checkSufficientBalance = async (sourceTokenAddress: any) => {
    if (sourceInfo.chainId === kanaChainIdList.solana) {
      let userTokenAccount; //token account publickey of token1
      let tokenBalance;
      //check the balance if the selected token is sol
      if (
        sourceTokenAddress === "So11111111111111111111111111111111111111112"
      ) {
        userTokenAccount = publicKey;
        //@ts-ignore
        let mintBalance = await connection.getBalance(publicKey);
        tokenBalance = mintBalance / LAMPORTS_PER_SOL;
        let status = checkSourceTokenBalance(tokenBalance);
        if (!status) return { error: true, data: null };
      } else {
        //returns the token account detaials of a token owned by the wallet
        let tokenAccount = await connection.getTokenAccountsByOwner(
          //@ts-ignore
          publicKey,
          { mint: new PublicKey(sourceTokenAddress) }
        );
        let accountOwned = tokenAccount.value[0];
        //checks the availability of token account
        if (accountOwned === undefined) {
          toast.error(`Please add ${sourceInfo.tokenSymbol} to your wallet`);
          return { error: true, data: null };
        } else {
          userTokenAccount = accountOwned.pubkey;
          let mintBalance = await connection.getTokenAccountBalance(
            userTokenAccount
          );
          tokenBalance = mintBalance.value.uiAmount;
          let status = checkSourceTokenBalance(tokenBalance);
          if (!status) return { error: true, data: null };
        }
      }
    } else if (sourceInfo.chainId === kanaChainIdList.aptos) {
      try {
        let tokenInWallet = availableAptosTokens.find(
          (x: any) => x.address === sourceTokenAddress
        );
        if (tokenInWallet) {
          let tokenBalance = tokenInWallet?.balance;
          let status = checkSourceTokenBalance(tokenBalance);
          if (!status) return { error: true, data: null };
        } else {
          toast.error(`Please add ${sourceInfo.tokenSymbol} to your wallet`);
          return { error: true, data: null };
        }
      } catch (error: any) {
        toast.error(`Please add ${sourceInfo.tokenSymbol} to your wallet`);
        return { error: true, data: null };
      }
    } else if (
      sourceInfo.chainId === kanaChainIdList.polygon ||
      sourceInfo.chainId === kanaChainIdList.binance ||
      sourceInfo.chainId === kanaChainIdList.ethereum
    ) {
      try {
        let availableTokens;
        if (sourceInfo.chainId === kanaChainIdList.polygon) {
          availableTokens = availablePolygonTokens;
        } else if (sourceInfo.chainId === kanaChainIdList.binance) {
          availableTokens = availableBinanceTokens;
        } else if (sourceInfo.chainId === kanaChainIdList.ethereum) {
          availableTokens = availableEthereumTokens;
        }
        let tokenInWallet = availableTokens.find(
          (x: any) =>
            String(x.address).toLowerCase() ===
            String(sourceTokenAddress).toLowerCase()
        );
        if (tokenInWallet) {
          let tokenBalance = getUiAmount(
            tokenInWallet?.balance,
            tokenInWallet?.decimals
          );
          let status = checkSourceTokenBalance(tokenBalance);
          if (!status) return { error: true, data: null };
        } else {
          toast.error(`Please add ${sourceInfo.tokenSymbol} to your wallet`);
          return { error: true, data: null };
        }
      } catch (error: any) {
        toast.error(`Please add ${sourceInfo.tokenSymbol} to your wallet`);
        return { error: true, data: null };
      }
    }
  };

  const isSwapable = async (sourceTokenAddress: any) => {
    try {
      toast.dismiss();
      let status = await checkSufficientBalance(sourceTokenAddress);
      if (status?.error) {
        return { error: true, data: null };
      }
      return { error: null, data: true };
    } catch (error: any) {
      console.log("Error occurred in ", error);
      return { error: true, data: null };
    }
  };

  const sendTransactionToEtherspot = async () => {
    try {
      const estimation = await estimate();
      console.log("Estimation", estimation);
      let estimatedData = estimation[0].estimatedBatches;
      if (estimatedData) {
        //console.log("estimation ...", estimation[0].estimatedBatches);
        let sendResult = await send();
        console.log("sendData", sendResult);
        let sentData = sendResult[0].sentBatches;
        if (JSON.stringify(sendResult).includes("reverted")) {
          if (estimatedData[0].cost) {
            let cost = trimToFloor(
              //@ts-ignore
              getUiAmount(Number(estimatedData[0].cost.toString()), 18),
              4
            );
            console.log("cost", cost)
            toast.error(
              `Transaction Reverted , pls check your wallet ! you need atleast ${cost} in ur smart wallet`
            );
            setSameChainSwap({
              ...sameChainSwap,
              status: "failed",
            });
          } else {
            toast.error(
              `Transaction Reverted , pls check balance in your wallet ! `
            );
            setSameChainSwap({
              ...sameChainSwap,
              status: "failed",
            });
          }
        } else {
          console.log("sentBatches", sentData[0]);
          let txHash;
          let batchhash = sentData[0].batchHash;
          if (sourceInfo.chainId === kanaChainIdList.polygon) {
           txHash = await getPolygonHashFromBatchHash(batchhash);
          } else if (sourceInfo.chainId === kanaChainIdList.binance) {
            txHash = await getBSCHashFromBatchHash(batchhash);
          }
          setSameChainSwap({
            ...sameChainSwap,
            completionPercentage: 100,
            status: "success",
            hash: txHash,
          });
        }
        // }
      } else {
        console.log("estimation data is not available");
        toast.error(`Transaction Estimation Failed`);
        setSameChainSwap({
          ...sameChainSwap,
          status: "failed",
        });
      }
    } catch (error) {
      console.log("etherspot failed", error);
      toast.error(`Swap Failed ...! pls check ur Etherspot Smart Wallet`);
      setSameChainSwap({
        ...sameChainSwap,
        status: "failed",
      });
    }
  };

  const submitEvmTransaction = async (data: any, chainId: number) => {
    const status = await submitSwapTransactionEvm(data, signer, chainId);

    if (status.error === true) {
      //@ts-ignore
      if (status?.data["code"] === "ACTION_REJECTED") {
        toast.error("Transaction rejected by user");
      } else {
        toast.error("Transaction failed");
      }
      setSameChainSwap({
        ...sameChainSwap,
        status: "failed",
      });
    } else {
      let lastHash = status.data[status.data.length - 1].transactionHash;
      setSameChainSwap({
        ...sameChainSwap,
        completionPercentage: 100,
        status: "success",
        hash: lastHash,
      });
    }
  };

  const submitSwap = async () => {
    setAutoRefresh(false);
    if (sourceInfo.chainId === targetInfo.chainId) {
      try {
        if (swapable.data) {
          setSameChainSwap({
            ...sameChainSwap,
            completionPercentage: 60,
          });

          if (sourceInfo.chainId === kanaChainIdList.solana) {
            const swapSignature = await submitSolanaversionedTransaction(
              swapInstructionResponse.data.swapInstruction,
              connection,
              signTransaction
            );
            setSameChainSwap({
              ...sameChainSwap,
              completionPercentage: 100,
              status: "success",
              hash: swapSignature,
            });
          } else if (sourceInfo.chainId === kanaChainIdList.aptos) {
            const swapHash = await submitAptosEntryFunctionPayload(
              swapInstructionResponse.data.swapInstruction,
              signAndSubmitTransaction,
              "40000"
            );
            if (swapHash === undefined) {
              toast.warning(
                "extension stream is closed , Please Refresh your page"
              );
              setSameChainSwap({
                ...sameChainSwap,
                status: "failed",
              });
            } else {
              setSameChainSwap({
                ...sameChainSwap,
                completionPercentage: 100,
                status: "success",
                hash: swapHash,
              });
            }
          } else if (sourceInfo.chainId === kanaChainIdList.polygon) {
            if (swapInstructionResponse.error === "false") {
              // await new Promise((resolve) =>
              //   setTimeout(() => resolve(1), 2000)
              // );
              // chain?.id !== 137 && network.switchNetwork && network?.switchNetwork(137);
              if (isSocialLogin) {
                sendTransactionToEtherspot();
              } else {
                if (chain?.id === 137) {
                  submitEvmTransaction(
                    swapInstructionResponse.data,
                    kanaChainIdList.polygon
                  );
                } else {
                  throw new Error("Change wallet network to Polygon Mainnet");
                }
              }
            } else {
              console.log(swapInstructionResponse.message);
            }
          } else if (sourceInfo.chainId === kanaChainIdList.binance) {
            if (swapInstructionResponse.error === "false") {
              // chain?.id !== 56 && network.switchNetwork && network?.switchNetwork(56);
              if (isSocialLogin) {
                sendTransactionToEtherspot();
              } else {
                if (chain?.id === 56) {
                  submitEvmTransaction(
                    swapInstructionResponse.data,
                    kanaChainIdList.binance
                  );
                } else {
                  throw new Error("Change wallet network to BSC Mainnet");
                }
              }
            } else {
              console.log(swapInstructionResponse.message);
            }
          } else if (sourceInfo.chainId === kanaChainIdList.ethereum) {
            if (swapInstructionResponse.error === "false") {
              // chain?.id !== 1 && network.switchNetwork && network?.switchNetwork(1);
              if (chain?.id === 1) {
                submitEvmTransaction(
                  swapInstructionResponse.data,
                  kanaChainIdList.ethereum
                );
              } else {
                throw new Error("Change wallet network to Ethereum Mainnet");
              }
            } else {
              console.log(swapInstructionResponse.message);
            }
          }
        } else if (swapable.error && swapable.data === null) {
          setSameChainSwap({
            ...sameChainSwap,
            status: "failed",
          });
        }
      } catch (error: any) {
        console.log("Error occurred......", error);
        if (
          error.toString() ===
            "WalletSignTransactionError: User rejected the request." ||
          error.code === "ACTION_REJECTED" ||
          error.code === 4001
        ) {
          toast.error("Transaction rejected by user");
        } else if (
          error.message.toString() === "Internal Server Error" ||
          error.message.toString() === "Service Unavailable"
        ) {
          toast.error("Failed to get quote, Please try again");
          return;
        } else {
          toast.error(
            error.message ? error.message : "Swap transaction failed"
          );
        }
        setSameChainSwap({
          ...sameChainSwap,
          status: "failed",
        });
      } finally {
        setAutoRefresh(true);
      }
    } else {
      let status: any = await checkSufficientBalance(sourceInfo.tokenAddress);
      if (status?.error !== true) {
        submitCrossChainSwap();
      } else {
        setSourceChainSwap({
          ...sourceChainSwap,
          status: "failed",
        });
        setAutoRefresh(true);
      }
    }
  };

  useEffect(() => {
    console.log({ swapInstructionResponse, swapable, swapIx });
  }, [swapInstructionResponse, swapable, swapIx]);

  const getSameChainSwapDetails = async () => {
    setSameChainSwap({
      ...sameChainSwap,
      completionPercentage: 10,
    });
    let swapableData = await isSwapable(sourceInfo.tokenAddress);
    setIsSwapable(swapableData);
    setSameChainSwap({
      ...sameChainSwap,
      completionPercentage: 30,
    });
    let payloadType =
      sourceInfo.chainId === kanaChainIdList.aptos
        ? AptosTxType.EntryFunction
        : undefined;
    let isAllowed: any;
    if (sourceInfo.chainId === kanaChainIdList.polygon) {
      let allowance = await CheckAllowance(
        3,
        sourceInfo.tokenAddress,
        address || ""
      );
      isAllowed = false;
      if (Number(allowance) > Number(sourceInfo.tokenAmount)) {
        isAllowed = true;
      }
    } else if (sourceInfo.chainId === kanaChainIdList.binance) {
      let allowance = await CheckAllowance(
        5,
        sourceInfo.tokenAddress,
        address || ""
      );
      isAllowed = false;
      if (Number(allowance) > Number(sourceInfo.tokenAmount)) {
        isAllowed = true;
      }
    } else if (sourceInfo.chainId === kanaChainIdList.ethereum) {
      let allowance = await CheckAllowance(
        kanaChainIdList.ethereum,
        sourceInfo.tokenAddress,
        address || ""
      );
      isAllowed = false;
      if (Number(allowance) > Number(sourceInfo.tokenAmount)) {
        isAllowed = true;
      }
    }

    if (swapableData) {
      const response = await getSwapInstruction(
        "GlQ9v35gW6ftP28Aht08xADF0y0Y3W",
        sourceInfo.chainId,
        selectedRoute?.data,
        chainAddress.sourceChainAddress,
        payloadType,
        isAllowed,
        undefined,
        Environment.DEV
      );

      setSwapInstructionResponse(response);
      if(sourceInfo.chainId === targetInfo.chainId){
        if(sourceInfo.chainId === kanaChainIdList.polygon ||(sourceInfo.chainId === kanaChainIdList.binance )){
        setSwapIx(response?.data?.swapInstruction);
        }
      }
    }
    return swapableData;
  };

  const validateSolanaSwap = async (address: any, gasEstimation: any) => {
    //validate addresses
    await validateSolAddress(address, connection);
    //check Native Balance
    const balance = await connection.getBalance(new PublicKey(address));
    if (balance / LAMPORTS_PER_SOL < gasEstimation / LAMPORTS_PER_SOL) {
      setSourceChainSwap({
        ...sourceChainSwap,
        status: "failed",
        hash: null,
      });
      throw new Error(
        `Need ${
          gasEstimation / LAMPORTS_PER_SOL - balance / LAMPORTS_PER_SOL
        } SOL to initiate Swap`
      );
    }
  };

  const validateAptosSwap = async (address: any, gasEstimation: any) => {
    await validateAptAddress(address, getAptosRpcEndPoint());
    const balance = await getAptosNativeBalance(address);
    if (balance / 100000000 < gasEstimation / 100000000) {
      setSourceChainSwap({
        ...sourceChainSwap,
        status: "failed",
        hash: null,
      });
      throw new Error(
        `Need ${
          gasEstimation / 100000000 - balance / 100000000
        } APT to initiate Swap`
      );
    }
  };

  const validatePolygonSwap = async (address: any, gasEstimation: any) => {
    const balance = await getEvmNativeBalance(address, kanaChainIdList.polygon);
    if (
      getUiAmount(Number(balance), 18) < getUiAmount(Number(gasEstimation), 18)
    ) {
      setSourceChainSwap({
        ...sourceChainSwap,
        status: "failed",
        hash: null,
      });
      throw new Error(
        `Need ${
          getUiAmount(Number(gasEstimation), 18) -
          getUiAmount(Number(balance), 18)
        } MATIC to initiate Swap`
      );
    }
  };

  const validateBinanceSwap = async (address: any, gasEstimation: any) => {
    const balance = await getEvmNativeBalance(address, kanaChainIdList.binance);
    if (
      getUiAmount(Number(balance), 18) < getUiAmount(Number(gasEstimation), 18)
    ) {
      setSourceChainSwap({
        ...sourceChainSwap,
        status: "failed",
        hash: null,
      });
      throw new Error(
        `Need ${
          getUiAmount(Number(gasEstimation), 18) -
          getUiAmount(Number(balance), 18)
        } BNB to initiate Swap`
      );
    }
  };

  // const wait = async() => {
  //     if(!(chain?.id === 1)){
  //         connector?.switchChain && await connector?.switchChain(1);
  //     }
  //     console.log(provider,"provider")
  //     provider = getProvider();
  //     console.log("🚀 ~ file: KanaWidget.tsx:2133 ~ wait ~ provider:", provider)
  //     const data = await provider.waitForTransaction("0xee07aa81ad5c4ac3f67241a056a870581c05d937728fb95305b7d0c02f0dabd3")
  //     console.log(data,"wait data")
  // }

  const validateEthereumSwap = async (address: any, gasEstimation: any) => {
    const balance = await getEvmNativeBalance(
      address,
      kanaChainIdList.ethereum
    );
    console.log(
      getUiAmount(Number(balance), 18),
      "getUiAmount(Number(balance), 18)"
    );
    console.log(
      getUiAmount(Number(gasEstimation), 18),
      "getUiAmount(Number(gasEstimation), 18)"
    );

    if (
      getUiAmount(Number(balance), 18) < getUiAmount(Number(gasEstimation), 18)
    ) {
      setSourceChainSwap({
        ...sourceChainSwap,
        status: "failed",
        hash: null,
      });
      throw new Error(
        `Need ${
          getUiAmount(Number(gasEstimation), 18) -
          getUiAmount(Number(balance), 18)
        } ETH to initiate Swap`
      );
    }
  };

  const crossChainExecution = async (
    isAllowed: any,
    sourceSignTransaction: any,
    targetSignTransaction: any,
    targetWallet: any
  ) => {
    const sourceData = await sourceSwap(
      "GlQ9v35gW6ftP28Aht08xADF0y0Y3W",
      selectedRoute,
      chainAddress.sourceChainAddress,
      chainAddress.targetChainAddress,
      isAllowed,
      setSourceChainSwap,
      sourceChainSwap,
      connection,
      sourceSignTransaction
    );

    setSwapBridging({
      ...swapBridging,
      completionPercentage: 50,
    });
    const vaaBytes = await crossChainBridging(
      selectedRoute,
      sourceData.transactionHash,
      sourceData.transferReceipt,
      provider,
      setSwapBridging,
      swapBridging
    );
    switch (selectedRoute.targetChainID) {
      case kanaChainIdList.ethereum: {
        if (chain?.id !== 1) {
          await (network.switchNetworkAsync && network.switchNetworkAsync(1));
          provider = getProvider();
        }
        break;
      }
      case kanaChainIdList.binance: {
        if (chain?.id !== 56) {
          await (network.switchNetworkAsync && network.switchNetworkAsync(56));
          provider = getProvider();
        }
        break;
      }
      case kanaChainIdList.polygon: {
        if (chain?.id !== 137) {
          await (network.switchNetworkAsync && network.switchNetworkAsync(137));
          provider = getProvider();
        }
        break;
      }
      default:
        break;
    }
    if (
      selectedRoute.targetChainID === kanaChainIdList.polygon ||
      selectedRoute.targetChainID === kanaChainIdList.binance ||
      selectedRoute.targetChainID === kanaChainIdList.ethereum
    ) {
      let signer = await fetchSigner();
      targetSignTransaction = signer;
    }
    await crossChainTargetClaim(
      selectedRoute,
      chainAddress.targetChainAddress,
      connection,
      targetSignTransaction,
      vaaBytes,
      "GlQ9v35gW6ftP28Aht08xADF0y0Y3W",
      isAllowed,
      targetWallet,
      setTargetChainSwap,
      targetChainSwap,
      provider
    );
  };

  const submitCrossChainSwap = async () => {
    try {
      setAutoRefresh(false);
      let sourceSignTransaction;
      let targetSignTransaction;
      let isAllowed: boolean = false;
      let targetWallet: any;
      switch (selectedRoute.sourceChainID) {
        case kanaChainIdList.solana: {
          setSourceChainSwap({
            ...sourceChainSwap,
            completionPercentage: 20,
          });
          await validateSolanaSwap(
            chainAddress?.sourceChainAddress,
            selectedRoute?.sourceGasEstimation
          );
          sourceSignTransaction = signTransaction;
          break;
        }
        case kanaChainIdList.aptos: {
          await validateAptosSwap(
            chainAddress?.sourceChainAddress,
            selectedRoute?.sourceGasEstimation
          );
          sourceSignTransaction = signAndSubmitTransaction;
          break;
        }
        case kanaChainIdList.polygon: {
          await validatePolygonSwap(
            chainAddress?.sourceChainAddress,
            selectedRoute?.sourceGasEstimation
          );
          sourceSignTransaction = signer;
          if (selectedRoute.swapType === 1 || selectedRoute.swapType === 3) {
            let allowance = await CheckAllowance(
              kanaChainIdList.polygon,
              selectedRoute?.sourceRoute?.fromToken?.address,
              address || ""
            );
            if (Number(allowance) > Number(sourceInfo.tokenAmount)) {
              isAllowed = true;
            }
          }
          break;
        }
        case kanaChainIdList.binance: {
          await validateBinanceSwap(
            chainAddress?.sourceChainAddress,
            selectedRoute?.sourceGasEstimation
          );
          sourceSignTransaction = signer;
          if (selectedRoute.swapType === 1 || selectedRoute.swapType === 3) {
            let allowance = await CheckAllowance(
              kanaChainIdList?.binance,
              selectedRoute?.sourceRoute?.fromToken?.address,
              address || ""
            );
            if (Number(allowance) > Number(sourceInfo.tokenAmount)) {
              isAllowed = true;
            }
          }
          break;
        }
        case kanaChainIdList.ethereum: {
          await validateEthereumSwap(
            chainAddress?.sourceChainAddress,
            selectedRoute?.sourceGasEstimation
          );
          sourceSignTransaction = signer;
          if (selectedRoute.swapType === 1 || selectedRoute.swapType === 3) {
            let allowance = await CheckAllowance(
              kanaChainIdList?.ethereum,
              selectedRoute?.sourceRoute?.fromToken?.address,
              address || ""
            );
            if (Number(allowance) > Number(sourceInfo.tokenAmount)) {
              isAllowed = true;
            }
          }
          break;
        }
      }

      switch (selectedRoute.targetChainID) {
        case kanaChainIdList.solana: {
          await validateSolanaSwap(
            chainAddress?.targetChainAddress,
            selectedRoute?.targetGasEstimation
          );
          targetSignTransaction = signTransaction;
          break;
        }
        case kanaChainIdList.aptos: {
          await validateAptosSwap(
            chainAddress?.targetChainAddress,
            selectedRoute?.targetGasEstimation
          );
          targetWallet = aptosWallet;
          targetSignTransaction = signAndSubmitTransaction;
          break;
        }
        case kanaChainIdList.polygon: {
          await validatePolygonSwap(
            chainAddress?.targetChainAddress,
            selectedRoute?.targetGasEstimation
          );
          targetSignTransaction = signer;
          if (selectedRoute.swapType === 1 || selectedRoute.swapType === 4) {
            let allowance = await CheckAllowance(
              3,
              selectedRoute.targetBridgeToken,
              address || ""
            );
            if (Number(allowance) > Number(selectedRoute.bridgeAmount)) {
              isAllowed = true;
            }
          }
          break;
        }
        case kanaChainIdList.binance: {
          await validateBinanceSwap(
            chainAddress?.targetChainAddress,
            selectedRoute?.targetGasEstimation
          );
          targetSignTransaction = signer;
          if (selectedRoute.swapType === 1 || selectedRoute.swapType === 4) {
            let allowance = await CheckAllowance(
              kanaChainIdList.binance,
              selectedRoute.targetBridgeToken,
              address || ""
            );
            if (Number(allowance) > Number(selectedRoute.bridgeAmount)) {
              isAllowed = true;
            }
          }
          break;
        }
        case kanaChainIdList.ethereum: {
          await validateEthereumSwap(
            chainAddress?.targetChainAddress,
            selectedRoute?.targetGasEstimation
          );
          targetSignTransaction = signer;
          if (selectedRoute.swapType === 1 || selectedRoute.swapType === 4) {
            let allowance = await CheckAllowance(
              kanaChainIdList.ethereum,
              selectedRoute.targetBridgeToken,
              address || ""
            );
            if (Number(allowance) > Number(selectedRoute.bridgeAmount)) {
              isAllowed = true;
            }
          }
          break;
        }
      }
      setSourceChainSwap({
        ...sourceChainSwap,
        completionPercentage: 20,
      });

      await crossChainExecution(
        isAllowed,
        sourceSignTransaction,
        targetSignTransaction,
        targetWallet
      );
      // await crossChainExecution(
      //     "GlQ9v35gW6ftP28Aht08xADF0y0Y3W",
      //     selectedRoute,
      //     chainAddress.sourceChainAddress,
      //     chainAddress.targetChainAddress,
      //     sourceSignTransaction,
      //     targetSignTransaction,
      //     connection,
      //     provider,
      //     isAllowed,
      //     targetWallet,
      //     setSourceChainSwap,
      //     sourceChainSwap,
      //     setSwapBridging,
      //     swapBridging,
      //     setTargetChainSwap,
      //     targetChainSwap,
      //     network
      // );
    } catch (error: any) {
      console.log("Error occurred in submitCrossChainSwap::" + error);
      setTargetChainSwap({
        ...targetChainSwap,
        status: "failed",
        hash: null,
      });
      if (
        error.toString() ===
          "WalletSignTransactionError: User rejected the request." ||
        error.code === "ACTION_REJECTED" ||
        error.code === 4001
      ) {
        toast.error("Transaction rejected by user");
      } else if (
        error.message.toString() === "Internal Server Error" ||
        error.message.toString() === "Service Unavailable"
      ) {
        toast.error("Failed to get Swap Details, Please try again");
        return;
      } else {
        toast.error(error.message ? error.message : "Swap transaction failed");
      }
    } finally {
      setAutoRefresh(true);
    }
  };

  const getMaxAmount = () => {
    switch (sourceInfo.chainId) {
      case kanaChainIdList.aptos:
        if (connected) {
          if (sourceInfo.tokenAddress === "0x1::aptos_coin::AptosCoin") {
            let calculatedMaxAmount = AptTokenMaxCalc(sourceInfo.tokenBalance);
            setSourceInfo((source: any) => {
              source.tokenAmount = calculatedMaxAmount?.toString();
            });
          } else {
            setSourceInfo((source: any) => {
              source.tokenAmount = source.tokenBalance.toString();
            });
          }
        } else {
          setSourceInfo((source: any) => {
            source.tokenAmount = "0";
          });
          setTargetInfo((target: any) => {
            target.tokenAmount = "";
          });
        }
        break;
      case kanaChainIdList.solana:
        if (solanaWalletConnected) {
          if (
            sourceInfo.tokenAddress ===
            "So11111111111111111111111111111111111111112"
          ) {
            const calculatedMaxAmount = SolTokenMaxCalc(
              sourceInfo.tokenBalance
            );
            setSourceInfo((source: any) => {
              source.tokenAmount = calculatedMaxAmount?.toString();
            });
          } else {
            setSourceInfo((source: any) => {
              source.tokenAmount = source.tokenBalance;
            });
          }
        } else {
          setSourceInfo((source: any) => {
            source.tokenAmount = "0";
          });
          setTargetInfo((target: any) => {
            target.tokenAmount = "";
          });
        }
        break;
      case kanaChainIdList.polygon:
        if (address) {
          if (
            sourceInfo.tokenAddress ===
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ) {
            const calculatedMaxAmount = MaticTokenMaxCalc(
              sourceInfo.tokenBalance
            );
            setSourceInfo((source: any) => {
              source.tokenAmount = calculatedMaxAmount?.toString();
            });
          } else {
            setSourceInfo((source: any) => {
              source.tokenAmount = source.tokenBalance;
            });
          }
        } else {
          setSourceInfo((source: any) => {
            source.tokenAmount = "0";
          });
          setTargetInfo((target: any) => {
            target.tokenAmount = "";
          });
        }
        break;
      case kanaChainIdList.binance:
        if (address) {
          if (
            sourceInfo.tokenAddress ===
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ) {
            const calculatedMaxAmount = BSCTokenMaxCalc(
              sourceInfo.tokenBalance
            );
            setSourceInfo((source: any) => {
              source.tokenAmount = calculatedMaxAmount?.toString();
            });
          } else {
            setSourceInfo((source: any) => {
              source.tokenAmount = source.tokenBalance;
            });
          }
        } else {
          setSourceInfo((source: any) => {
            source.tokenAmount = "0";
          });
          setTargetInfo((target: any) => {
            target.tokenAmount = "";
          });
        }
        break;
      case kanaChainIdList.ethereum:
        if (address) {
          if (
            sourceInfo.tokenAddress ===
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          ) {
            const calculatedMaxAmount = ETHTokenMaxCalc(
              sourceInfo.tokenBalance
            );
            setSourceInfo((source: any) => {
              source.tokenAmount = calculatedMaxAmount?.toString();
            });
          } else {
            setSourceInfo((source: any) => {
              source.tokenAmount = source.tokenBalance;
            });
          }
        } else {
          setSourceInfo((source: any) => {
            source.tokenAmount = "0";
          });
          setTargetInfo((target: any) => {
            target.tokenAmount = "";
          });
        }
        break;
    }
  };

  const getPercentageAmount = (percentage: any) => {
    if (!isRouteLoading) {
      let amount = "";
      if (percentage === "25%") {
        amount = ((sourceInfo.tokenBalance / 100) * 25).toString();
        setSourceInfo((source: any) => {
          source.tokenAmount = amount.toString();
        });
      } else if (percentage === "50%") {
        amount = ((sourceInfo.tokenBalance / 100) * 50).toString();
        setSourceInfo((source: any) => {
          source.tokenAmount = amount.toString();
        });
      } else if (percentage === "100%") {
        getMaxAmount();
      } else if ("Clear") {
        setRoutesVisibility(false);
        setSourceInfo((source: any) => {
          source.tokenAmount = amount.toString();
        });
        setTargetInfo((target: any) => {
          target.tokenAmount = "";
        });
      }
    }
  };

  const startSwap = async () => {
    setPreviewVisibility(false);
    setSwapModalVisibility(true);
    submitSwap();
  };

  const ChainAndTokenListView = () => {
    let selected =
      chainAndTokenListVisibility.clickedFrom === "source"
        ? sourceInfo
        : targetInfo;
    let tokensList =
      chainAndTokenListVisibility.clickedFrom === "source"
        ? sourceTokenList
        : targetTokenList;
    const primaryColor = props?.config.containerStyle?.primaryColor;
    const secondaryColor = props?.config.containerStyle?.secondaryColor;
    return (
      <div>
        <div className="w-full">
          <div className="flex justify-between items-center">
            <div className="text-xl font-inter font-bold">
              {chainAndTokenListVisibility.clickedFrom === "source"
                ? "Swap from"
                : "Swap to"}
            </div>
            <img
              src={CloseIcon}
              className="cursor-pointer"
              onClick={() => {
                setChainAndTokenListVisibility({
                  ...chainAndTokenListVisibility,
                  visibility: false,
                });
                setTokenSearchText("");
              }}
              alt="reset"
            />
          </div>

          <div className="min-h-[25rem]">
            <div
              className="flex items-center bg-widgetPrimary px-3 py-1 mt-5 rounded-lg border-[1px] border-[#413F47]"
              style={{ backgroundColor: primaryColor }}
            >
              <img src={SearchIcon} className="mr-1" alt="" />
              <input
                type="text"
                autoFocus={true}
                placeholder="Search"
                value={tokenSearchText}
                onChange={(e: any) => onTokenSearchTextChange(e)}
                className="outline-0 w-full border-0 bg-transparent font-inter p-2"
              />
            </div>
            <div className="grid grid-cols-5 gap-2 mt-4">
              <div
                className={`rounded-lg grid place-items-center cursor-pointer`}
                style={
                  selected.chainId === kanaChainIdList.aptos
                    ? primaryColor
                      ? { background: primaryColor }
                      : { background: "#130E18" }
                    : { background: "#2c2533" }
                }
                onClick={() => selectChain(kanaChainIdList.aptos)}
              >
                <img src={Aptos} className="w-9 py-3" alt="" />
              </div>
              <div
                className={`rounded-lg grid place-items-center cursor-pointer`}
                style={
                  selected.chainId === kanaChainIdList.solana
                    ? primaryColor
                      ? { background: primaryColor }
                      : { background: "#130E18" }
                    : { background: "#2c2533" }
                }
                onClick={() => selectChain(kanaChainIdList.solana)}
              >
                <img src={Solana} className="w-9 py-3" alt="" />
              </div>
              <div
                className={`rounded-lg grid place-items-center cursor-pointer`}
                style={
                  selected.chainId === kanaChainIdList.ethereum
                    ? primaryColor
                      ? { background: primaryColor }
                      : { background: "#130E18" }
                    : { background: "#2c2533" }
                }
                onClick={() => selectChain(kanaChainIdList.ethereum)}
              >
                <img src={EthereumImg} className="w-7 py-3" alt="" />
              </div>
              <div
                className={`rounded-lg grid place-items-center cursor-pointer`}
                style={
                  selected.chainId === kanaChainIdList.polygon
                    ? primaryColor
                      ? { background: primaryColor }
                      : { background: "#130E18" }
                    : { background: "#2c2533" }
                }
                onClick={() => selectChain(kanaChainIdList.polygon)}
              >
                <img src={Polygon} className="w-9 py-3" alt="" />
              </div>
              <div
                className={`rounded-lg grid place-items-center cursor-pointer`}
                style={
                  selected.chainId === kanaChainIdList.binance
                    ? primaryColor
                      ? { background: primaryColor }
                      : { background: "#130E18" }
                    : { background: "#2c2533" }
                }
                onClick={() => selectChain(kanaChainIdList.binance)}
              >
                <img src={Binance} className="w-9 py-3" alt="" />
              </div>
            </div>
            <div
              className="bg-widgetSecondary relative rounded-3xl mt-5 px-2 py-1 h-[22rem] overflow-scroll"
              style={{ backgroundColor: secondaryColor }}
            >
              {isTokenListLoading ? (
                <div className="left-1/2 top-1/2 translate-y-[-50%] translate-x-[-50%] absolute">
                  <ClipLoader
                    color={"#fffff"}
                    loading={isTokenListLoading}
                    size={30}
                  />
                </div>
              ) : tokensList?.length <= 0 ? (
                <div className="left-1/2 top-1/2 translate-y-[-50%] translate-x-[-50%] absolute">
                  No tokens found
                </div>
              ) : (
                tokensList?.map((token: any, index: any) => (
                  <div
                    className={`flex items-center py-3 px-3 my-1.5 rounded-2xl cursor-pointer ${
                      primaryColor
                        ? `hover:bg-[${primaryColor}]`
                        : "hover:bg-widgetPrimary"
                    }`}
                    style={
                      selected.tokenSymbol === token.symbol
                        ? primaryColor
                          ? { background: primaryColor }
                          : { background: "#130E18" }
                        : {}
                    }
                    onClick={() => updateTokenSelect(token)}
                    key={index + token.name}
                  >
                    <img className="w-10" src={token.logoURI} alt="token" />
                    <div className="font-inter ml-2">
                      <div className="text-lg font-bold leading-5">
                        {token.symbol}
                      </div>
                      <div className="text-sm mt-[0.15rem] text-greyText">
                        {token.name}
                      </div>
                    </div>
                    {token?.hasOwnProperty("balance") && (
                      <div className="flex-1 text-right text-greyText">
                        {selected.chainId === kanaChainIdList.solana
                          ? token?.balance.uiAmountString
                          : [
                              kanaChainIdList.polygon,
                              kanaChainIdList.binance,
                              kanaChainIdList.ethereum,
                            ].includes(selected.chainId)
                          ? token.uiAmountString
                          : token?.balance}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const WalletConnectView = () => {
    const primaryColor = props?.config.containerStyle?.primaryColor;
    const secondaryColor = props?.config.containerStyle?.secondaryColor;
    let chainId =
      walletConnectVisibility.clickedFrom === "source"
        ? sourceInfo.chainId
        : targetInfo.chainId;
    return (
      <div>
        <div className="flex justify-between items-center">
          <div className="text-xl font-inter font-bold">
            {walletConnectVisibility.clickedFrom === "source"
              ? "Connect Source Wallet"
              : "Connect Target Wallet"}
          </div>
          <img
            src={CloseIcon}
            className="cursor-pointer"
            onClick={() => {
              setWalletConnectVisibility({
                ...walletConnectVisibility,
                visibility: false,
              });
              setShowEmailModal(false);
              setWalletSearchText("");
            }}
            alt="reset"
          />
        </div>
        <ConnectWallet
          walletSearchText={walletSearchText}
          onWalletSearchTextChange={onWalletSearchTextChange}
          chain={chainId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>
    );
  };

  const RedeemWalletConnectView = () => {
    const primaryColor = props?.config.containerStyle?.primaryColor;
    const secondaryColor = props?.config.containerStyle?.secondaryColor;
    let redeemChainId =
      redeemData.chainId === CHAIN_ID_APTOS
        ? kanaChainIdList.aptos
        : redeemData.chainId === CHAIN_ID_SOLANA
        ? kanaChainIdList.solana
        : redeemData.chainId === CHAIN_ID_POLYGON
        ? kanaChainIdList.polygon
        : redeemData.chainId === CHAIN_ID_BSC
        ? kanaChainIdList.binance
        : redeemData.chainId === CHAIN_ID_ETH
        ? kanaChainIdList.ethereum
        : 0;
    let chainId =
      redeemWalletConnectVisibility.clickedFrom === "source"
        ? redeemChain
        : redeemChainId;
    return (
      <div>
        <div className="flex justify-between items-center">
          <div className="text-xl font-inter font-bold">{"Connect Wallet"}</div>
          <img
            src={CloseIcon}
            className="cursor-pointer"
            onClick={() => {
              setRedeemWalletConnectVisibility({
                ...redeemWalletConnectVisibility,
                visibility: false,
              });
              setShowEmailModal(false);
              setWalletSearchText("");
            }}
            alt="reset"
          />
        </div>
        <ConnectWallet
          walletSearchText={walletSearchText}
          onWalletSearchTextChange={onWalletSearchTextChange}
          chain={chainId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>
    );
  };

  const setRedeemVisible = () => {
    setRoutesVisibility(false);
    setRedeemViewVisibility(true);

    // setRedeemSignature('');
    //setting default values to swap
    setSourceInfo((source: any) => {
      source.chainId = kanaChainIdList.aptos;
      source.chainName = "Aptos";
      source.chainImg = Aptos;
      source.tokenSymbol = APTOS_TOKEN_1.symbol;
      source.tokenImg = APTOS_TOKEN_1.logoURI;
      source.tokenAmount = "";
      source.tokenAddress = APTOS_TOKEN_1.address;
      source.tokenBalance = 0;
    });
    setTargetInfo((target: any) => {
      target.chainId = kanaChainIdList.aptos;
      target.chainName = "Aptos";
      target.chainImg = Aptos;
      target.tokenSymbol = APTOS_TOKEN_2.symbol;
      target.tokenImg = APTOS_TOKEN_2.logoURI;
      target.tokenAmount = "";
      target.tokenAddress = APTOS_TOKEN_2.address;
      target.tokenBalance = 0;
    });
  };

  useEffect(() => {
    if (!sourceInfo.tokenAmount || Number(sourceInfo.tokenAmount) <= 0) {
      setTargetInfo((target: any) => {
        target.tokenAmount = "";
      });
    }
  }, [targetInfo.tokenAmount]);

  useEffect(() => {
    console.log({ swapIx });
  }, [swapIx]);

  const SwapView = () => {
    const primaryColor = props?.config.containerStyle?.primaryColor;
    const secondaryColor = props?.config.containerStyle?.secondaryColor;
    let buttonColor = props?.config.containerStyle?.buttonColor;
    let isSourceSolanaWalletConnected =
      sourceInfo.chainId === kanaChainIdList.solana && solanaWalletConnected;
    let isSourceAptosWalletConnected =
      sourceInfo.chainId === kanaChainIdList.aptos && connected;
    // let isSourcePolygonWalletConnected = sourceInfo.chainId === kanaChainIdList.polygon && address;
    let isSourcePolygonWalletConnected =
      sourceInfo.chainId === kanaChainIdList.polygon &&
      polygon_address &&
      isEVMConnected;
    let isSourceBinanceWalletConnected =
      sourceInfo.chainId === kanaChainIdList.binance &&
      binance_address &&
      isEVMConnected;
    let isSourceEthereumWalletConnected =
      sourceInfo.chainId === kanaChainIdList.ethereum && address;
    let isTargetSolanaWalletConnected =
      targetInfo.chainId === kanaChainIdList.solana && solanaWalletConnected;
    let isTargetAptosWalletConnected =
      targetInfo.chainId === kanaChainIdList.aptos && connected;
    // let isTargetPolygonWalletConnected = targetInfo.chainId === kanaChainIdList.polygon && address;
    let isTargetPolygonWalletConnected =
      targetInfo.chainId === kanaChainIdList.polygon &&
      polygon_address &&
      isEVMConnected;
    let isTargetBinanceWalletConnected =
      targetInfo.chainId === kanaChainIdList.binance &&
      binance_address &&
      isEVMConnected;
    let isTargetEthereumWalletConnected =
      targetInfo.chainId === kanaChainIdList.ethereum && address;
    let solanaAccountAddress = publicKey?.toBase58();
    let aptosAccountAddress = account?.address;
    let polygonAccountAddress = null;
    let binanceAccountAddress = null;

    // console.log({
    //   isSourcePolygonWalletConnected,
    //   isSourceBinanceWalletConnected,
    //   isTargetPolygonWalletConnected,
    //   isTargetBinanceWalletConnected,
    // });

    if (isSourceBinanceWalletConnected || isTargetBinanceWalletConnected) {
      if (isSocialLogin) {
        binanceAccountAddress = binance_address;
      } else {
        binanceAccountAddress = address;
      }
    }

    if (isSourcePolygonWalletConnected || isTargetPolygonWalletConnected) {
      if (isSocialLogin) {
        polygonAccountAddress = polygon_address;
      } else {
        polygonAccountAddress = address;
      }
    }

    // if(Number(sourceInfo.tokenAmount) <= 0){
    //     setTargetInfo((target: any) => {
    //         target.tokenAmount = ''
    //     });
    //     setRoutesVisibility(false);
    // }
    return (
      <div>
        <div className="flex justify-between items-center">
          <div className="text-[1.4rem] font-inter font-bold">Swap</div>
          <div className="flex">
            <div
              className="bg-widgetSecondary cursor-pointer rounded-lg grid place-items-center px-3 font-bold font-inter mr-2"
              style={{ backgroundColor: secondaryColor }}
            >
              <div
                className={`${buttonColor ? "" : "bg-gradient"} bg-clip-text`}
                style={
                  buttonColor
                    ? {
                        WebkitTextFillColor: "transparent",
                        backgroundColor: buttonColor,
                      }
                    : { WebkitTextFillColor: "transparent" }
                }
                onClick={() => setRedeemVisible()}
              >
                Redeem
              </div>
            </div>
            <div
              className={`bg-widgetSecondary rounded-md mr-2 ${
                sourceInfo.tokenAmount ? "cursor-pointer" : "cursor-not-allowed"
              }`}
              onClick={() => sourceInfo.tokenAmount && getRoutes()}
              style={{ backgroundColor: secondaryColor }}
            >
              <img src={ResetIcon} className="p-1.5" alt="reset" />
            </div>
            <div
              className="bg-widgetSecondary rounded-md cursor-pointer"
              onClick={() => setSettingsViewVisibility(true)}
              style={{ backgroundColor: secondaryColor }}
            >
              <img src={SettingsIcon} className="p-1" alt="reset" />
            </div>
          </div>
        </div>

        <div className="flex items-center mt-6 px-2 justify-between">
          <div className="text-greyText font-inter">Pay</div>
          <div className="flex items-center">
            <div
              className={`${
                buttonColor ? "" : "bg-gradient"
              } bg-clip-text cursor-pointer`}
              style={
                buttonColor
                  ? {
                      WebkitTextFillColor: "transparent",
                      backgroundColor: buttonColor,
                    }
                  : { WebkitTextFillColor: "transparent" }
              }
              onClick={() => {
                setWalletConnectVisibility({
                  visibility: true,
                  clickedFrom: "source",
                });
              }}
            >
              {isSourceSolanaWalletConnected ? (
                <div className="flex items-center">
                  <img
                    className="w-[1.3rem] h-[1.3rem] mr-1"
                    src={wallet?.adapter?.icon}
                    alt=""
                  />
                  {solanaAccountAddress?.slice(0, 4) +
                    ".." +
                    solanaAccountAddress?.slice(-4)}
                </div>
              ) : isSourceAptosWalletConnected ? (
                <div className="flex items-center">
                  <img
                    className="w-[1.3rem] h-[1.3rem] mr-1"
                    src={connectedAptosWallet?.adapter?.icon}
                    alt=""
                  />
                  {aptosAccountAddress?.toString()?.slice(0, 4) +
                    ".." +
                    aptosAccountAddress?.toString()?.slice(-4)}
                </div>
              ) : isSourcePolygonWalletConnected ? (
                <div className="flex items-center">
                  <img
                    className="w-[1.3rem] h-[1.3rem] mr-1"
                    src={
                      connector?.id === "metaMask"
                        ? MetaMask
                        : connector?.id === "coinbase"
                        ? Coinbase
                        : Web3AuthLogo
                    }
                    alt=""
                  />
                  {polygonAccountAddress?.slice(0, 4) +
                    ".." +
                    polygonAccountAddress?.toString()?.slice(-4)}
                </div>
              ) : isSourceBinanceWalletConnected ? (
                <div className="flex items-center">
                  <img
                    className="w-[1.3rem] h-[1.3rem] mr-1"
                    src={
                      connector?.id === "metaMask"
                        ? MetaMask
                        : connector?.id === "coinbase"
                        ? Coinbase
                        : Web3AuthLogo
                    }
                    alt=""
                  />
                  {binanceAccountAddress?.slice(0, 4) +
                    ".." +
                    binanceAccountAddress?.toString()?.slice(-4)}
                </div>
              ) : isSourceEthereumWalletConnected ? (
                <div className="flex items-center">
                  <img
                    className="w-[1.3rem] h-[1.3rem] mr-1"
                    src={connector?.id === "metaMask" ? MetaMask : Coinbase}
                    alt=""
                  />
                  {address?.slice(0, 4) + ".." + address?.toString()?.slice(-4)}
                </div>
              ) : (
                <div>Connect Wallet</div>
              )}
            </div>
            {(isSourceSolanaWalletConnected ||
              isSourceAptosWalletConnected ||
              isSourcePolygonWalletConnected ||
              isSourceBinanceWalletConnected ||
              isSourceEthereumWalletConnected) && (
              <div
                className="ml-2 cursor-pointer"
                onClick={() => {
                  copyHash(chainAddress.sourceChainAddress);
                  toast.success("Address Copied");
                }}
              >
                <img src={CopyIcon} alt="" />
              </div>
            )}
          </div>
        </div>

        <div
          className="bg-widgetPrimary mt-2 rounded-3xl px-5 py-4"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div
              className="bg-widgetSecondary h-[4rem] px-3 rounded-2xl flex items-center cursor-pointer"
              style={{ backgroundColor: secondaryColor }}
              onClick={() => displayTokenList("source")}
            >
              <div className="relative rounded-full w-fit">
                <div>
                  <img className="w-9" src={sourceInfo.tokenImg} alt="token" />
                </div>
                <div
                  className={`absolute rounded-full bg-black right-0 bottom-0 translate-y-[25%] translate-x-[25%]`}
                >
                  <img
                    className="w-4 h-4 p-[2px] rounded-full"
                    src={sourceInfo.chainImg}
                    alt="chain"
                  />
                </div>
              </div>
              <div className="ml-3 font-inter font-bold">
                <div className="text-lg leading-4">
                  {sourceInfo.tokenSymbol}
                </div>
                <div className="text-xs leading-4">
                  <span className="font-normal text-[11px]">{"on "}</span>
                  {sourceInfo.chainName}
                </div>
              </div>
            </div>

            <div>
              <input
                id="source-token-amount"
                className="outline-0 border-0 h-full bg-transparent text-right font-inter w-full font-bold text-3xl"
                type="text"
                value={sourceInfo.tokenAmount}
                placeholder="0"
                min="0"
                autoFocus={true}
                autoComplete="off"
                onWheel={(event) => event.currentTarget.blur()}
                onKeyDown={(e) =>
                  ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                }
                onPaste={preventPasteNegativeNumber}
                onChange={onTokenAmountChange}
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-white opacity-80">
              <span className="text-greyText mr-2 opacity-100">Balance</span>
              {sourceInfo.tokenBalance}
            </div>
            <div className="font-inter text-xs flex gap-2">
              <div
                className={`bg-widgetSecondary px-2 py-1.5 rounded-lg ${
                  isRouteLoading ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                style={{ backgroundColor: secondaryColor }}
                onClick={() => getPercentageAmount("25%")}
              >
                25%
              </div>
              <div
                className={`bg-widgetSecondary px-2 py-1.5 rounded-lg ${
                  isRouteLoading ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                style={{ backgroundColor: secondaryColor }}
                onClick={() => getPercentageAmount("50%")}
              >
                50%
              </div>
              <div
                className={`bg-widgetSecondary px-2 py-1.5 rounded-lg ${
                  isRouteLoading ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                style={{ backgroundColor: secondaryColor }}
                onClick={() => getPercentageAmount("100%")}
              >
                MAX
              </div>
              <div
                className={`bg-[#441825] px-2 py-1.5 rounded-lg ${
                  isRouteLoading ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={() => getPercentageAmount("Clear")}
              >
                Clear
              </div>
            </div>
          </div>
        </div>

        <div className="flex relative items-end mt-6 px-2 justify-between w-full">
          <div className="text-greyText font-inter">Receive</div>
          <div
            className={`${
              allowInterChange && !isRouteLoading
                ? "cursor-pointer"
                : "cursor-not-allowed"
            } absolute left-1/2 bg-gradient rounded-[0.6rem] p-2 px-[0.6rem]`}
            style={buttonColor ? { background: buttonColor } : {}}
            onClick={() =>
              allowInterChange && !isRouteLoading
                ? interchangeSwap()
                : () => false
            }
          >
            <img className="w-[20px]" src={SwapIcon} alt="" />
          </div>
          <div className="flex items-center">
            <div
              className={`${
                buttonColor ? "" : "bg-gradient"
              } bg-clip-text cursor-pointer`}
              style={
                buttonColor
                  ? {
                      WebkitTextFillColor: "transparent",
                      backgroundColor: buttonColor,
                    }
                  : { WebkitTextFillColor: "transparent" }
              }
              onClick={() => {
                setWalletConnectVisibility({
                  visibility: true,
                  clickedFrom: "target",
                });
              }}
            >
              {isTargetSolanaWalletConnected ? (
                <div className="flex items-center">
                  <img
                    className="w-[1.3rem] h-[1.3rem] mr-1"
                    src={wallet?.adapter?.icon}
                    alt=""
                  />
                  {solanaAccountAddress?.slice(0, 4) +
                    ".." +
                    solanaAccountAddress?.slice(-4)}
                </div>
              ) : isTargetAptosWalletConnected ? (
                <div className="flex items-center">
                  <img
                    className="w-[1.3rem] h-[1.3rem] mr-1"
                    src={connectedAptosWallet?.adapter?.icon}
                    alt=""
                  />
                  {aptosAccountAddress?.toString()?.slice(0, 4) +
                    ".." +
                    aptosAccountAddress?.toString()?.slice(-4)}
                </div>
              ) : isTargetPolygonWalletConnected ? (
                <div className="flex items-center">
                  <img
                    className="w-[1.3rem] h-[1.3rem] mr-1"
                    src={
                      connector?.id === "metaMask"
                        ? MetaMask
                        : connector?.id === "coinbase"
                        ? Coinbase
                        : Web3AuthLogo
                    }
                    alt=""
                  />
                  {polygonAccountAddress?.slice(0, 4) +
                    ".." +
                    polygonAccountAddress?.toString()?.slice(-4)}
                </div>
              ) : isTargetBinanceWalletConnected ? (
                <div className="flex items-center">
                  <img
                    className="w-[1.3rem] h-[1.3rem] mr-1"
                    src={
                      connector?.id === "metaMask"
                        ? MetaMask
                        : connector?.id === "coinbase"
                        ? Coinbase
                        : Web3AuthLogo
                    }
                    alt=""
                  />
                  {binanceAccountAddress?.slice(0, 4) +
                    ".." +
                    binanceAccountAddress?.toString()?.slice(-4)}
                </div>
              ) : isTargetEthereumWalletConnected ? (
                <div className="flex items-center">
                  <img
                    className="w-[1.3rem] h-[1.3rem] mr-1"
                    src={connector?.id === "metaMask" ? MetaMask : Coinbase}
                    alt=""
                  />
                  {address?.slice(0, 4) + ".." + address?.toString()?.slice(-4)}
                </div>
              ) : (
                <div>Connect Wallet</div>
              )}
            </div>
            {(isTargetSolanaWalletConnected ||
              isTargetAptosWalletConnected ||
              isTargetPolygonWalletConnected ||
              isTargetBinanceWalletConnected ||
              isTargetEthereumWalletConnected) && (
              <div
                className="ml-2 cursor-pointer"
                onClick={() => {
                  copyHash(chainAddress.targetChainAddress);
                  toast.success("Address Copied");
                }}
              >
                <img src={CopyIcon} alt="" />
              </div>
            )}
          </div>
        </div>

        <div
          className="bg-widgetPrimary mt-3 mb-5 rounded-3xl px-5 py-4"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div
              className="bg-widgetSecondary h-[4rem] px-3 rounded-2xl flex items-center cursor-pointer"
              style={{ backgroundColor: secondaryColor }}
              onClick={() => displayTokenList("target")}
            >
              <div className="relative rounded-full w-fit">
                <div>
                  <img className="w-9" src={targetInfo.tokenImg} alt="token" />
                </div>
                <div
                  className={`absolute rounded-full bg-black right-0 bottom-0 translate-y-[25%] translate-x-[25%]`}
                >
                  <img
                    className="w-4 h-4 p-[2px] rounded-full"
                    src={targetInfo.chainImg}
                    alt="chain"
                  />
                </div>
              </div>
              <div className="ml-3 font-inter font-bold">
                <div className="text-lg leading-4">
                  {targetInfo.tokenSymbol}
                </div>
                <div className="text-xs leading-4">
                  <span className="font-normal text-[11px]">{"on "}</span>
                  {targetInfo.chainName}
                </div>
              </div>
            </div>

            <div>
              <input
                className="outline-0 border-0 h-full bg-transparent w-full text-right font-inter font-bold text-3xl"
                disabled
                type="text"
                id="target-token-amount"
                value={targetInfo.tokenAmount}
                placeholder="0"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="flex mt-4">
            <div className="text-sm text-white opacity-80">
              <span className="text-greyText mr-2 opacity-100">Balance</span>
              {targetInfo.tokenBalance}
            </div>
          </div>
        </div>

        {isRouteLoading ? (
          <button
            className="rounded-3xl cursor-pointer py-3 font-medium text-black font-inter tracking-wider w-full bg-gradient"
            style={buttonColor ? { background: buttonColor } : {}}
            id="loader"
          >
            <BeatLoader color={"#2c2533"} loading={isRouteLoading} size={10} />
          </button>
        ) : chainAddress.sourceChainAddress &&
          chainAddress.targetChainAddress &&
          sourceInfo.tokenAmount &&
          Number(sourceInfo.tokenAmount) > 0 ? (
          <button
            className="rounded-3xl cursor-pointer py-3 font-medium text-black font-inter tracking-wider w-full bg-gradient"
            style={buttonColor ? { background: buttonColor } : {}}
            id="preview_btn"
            onClick={async () => {
              if (sourceInfo.chainId === targetInfo.chainId) {
                await getSameChainSwapDetails();
              }
              setPreviewVisibility(true);
            }}
          >
            Preview
          </button>
        ) : (
          <button
            className="rounded-3xl cursor-not-allowed py-3 font-medium text-black font-inter tracking-wider w-full bg-gradient"
            style={buttonColor ? { background: buttonColor } : {}}
            id="connect_wallet_btn"
          >
            {chainAddress.sourceChainAddress &&
            chainAddress.targetChainAddress &&
            (!sourceInfo.tokenAmount || Number(sourceInfo.tokenAmount) <= 0)
              ? "Enter Swap Amount"
              : "Connect Wallets"}
          </button>
        )}

        <div className="flex justify-between items-center text-greyText mt-3 mx-2">
          <div>Slippage tolerance</div>
          <div>
            <span>{slippage}</span>
            <span>%</span>
          </div>
        </div>
      </div>
    );
  };

  const RoutesPreviewView = () => {
    const primaryColor = props?.config.containerStyle?.primaryColor;
    const buttonColor = props?.config.containerStyle?.buttonColor;
    let isSameChain = sourceInfo.chainId === targetInfo.chainId;
    let uiAmount = isSameChain
      ? selectedRoute.uiOutAmount
      : selectedRoute.uiTargetOutAmount;
    let uiDollarPrice = isSameChain
      ? selectedRoute.dollarPrice
      : selectedRoute.uiTargetDollarPrice;
    let kanaFee = isSameChain
      ? selectedRoute.uiKanaFee
      : selectedRoute.kanaBridgeFee;
    let timing = isSameChain
      ? sameChainEstimationTime
      : crossChainEstimationTime;
    return (
      <CustomModal>
        <div className="p-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="relative rounded-full w-fit">
                <div>
                  <img className="w-9" src={targetInfo.tokenImg} alt="token" />
                </div>
              </div>
              <div className="ml-3 font-inter">
                <div className="font-bold">{trimToFloor(uiAmount, 5)}</div>
                <div className="flex text-xs text-greyText">
                  <div className="mr-2">{`$ ${trimToFloor(
                    uiDollarPrice,
                    4
                  )}`}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <img src={TimeIcon} alt="" />
              <div className="font-inter text-xs opacity-80 ml-2">{timing}</div>
            </div>
          </div>
          {isSameChain ? (
            <div
              className="bg-widgetPrimary mt-6 px-3 py-4 rounded-xl flex"
              style={{ backgroundColor: primaryColor }}
            >
              <div>
                <div className="grid place-items-center font-inter font-bold mt-1 rounded-full h-8 w-8 bg-white text-black">
                  1
                </div>
              </div>
              <div className="ml-3">
                <div className="font-inter text-[15px]">
                  Swap on{" "}
                  <span className="font-bold">{sourceInfo.chainName}</span> via{" "}
                  <span className="font-bold">{selectedRoute.label}</span>
                </div>
                <div className="text-greyText text-xs">
                  {sourceInfo.tokenAmount +
                    " " +
                    sourceInfo.tokenSymbol +
                    " -> " +
                    targetInfo.tokenAmount +
                    " " +
                    targetInfo.tokenSymbol}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="bg-widgetPrimary mt-6 px-3 py-4 rounded-xl"
              style={{ backgroundColor: primaryColor }}
            >
              {sourceChainRoute && (
                <div className="flex">
                  <div>
                    <div className="grid place-items-center font-inter font-bold mt-1 rounded-full h-8 w-8 bg-white text-black">
                      1
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="font-inter text-[15px]">
                      Swap on{" "}
                      <span className="font-bold">{sourceInfo.chainName}</span>{" "}
                      via{" "}
                      <span className="font-bold">
                        {sourceChainRoute.label}
                      </span>
                    </div>
                    <div className="text-greyText text-xs">
                      {sourceChainRoute.paths}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex mt-3">
                <div>
                  <div className="grid place-items-center font-inter font-bold mt-1 rounded-full h-8 w-8 bg-white text-black">
                    {sourceChainRoute ? "2" : "1"}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="font-inter text-[15px]">
                    Bridge from{" "}
                    <span className="font-bold">{sourceInfo.chainName}</span> to{" "}
                    <span className="font-bold">{targetInfo.chainName}</span>{" "}
                    via{" "}
                    <span className="font-bold">{selectedRoute.bridge}</span>
                  </div>
                  <div className="text-greyText text-xs">
                    {selectedRoute?.bridgeUIAmount +
                      " " +
                      selectedRoute?.sourceBridgeTokenSymbol +
                      " -> " +
                      selectedRoute?.bridgeUIAmount +
                      " " +
                      selectedRoute?.targetBridgeTokenSymbol}
                  </div>
                </div>
              </div>
              {targetChainRoute && (
                <div className="flex mt-3">
                  <div>
                    <div className="grid place-items-center font-inter font-bold mt-1 rounded-full h-8 w-8 bg-white text-black">
                      {sourceChainRoute ? "3" : "2"}
                    </div>
                  </div>
                  <div className="ml-3 w-full">
                    <div className="font-inter text-[15px]">
                      Swap on{" "}
                      <span className="font-bold">{targetInfo.chainName}</span>{" "}
                      via{" "}
                      <span className="font-bold">
                        {targetChainRoute.label}
                      </span>
                    </div>
                    <div className="text-greyText text-xs">
                      {targetChainRoute.paths}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-sm mt-4 mx-2">
            <div className="flex justify-between items-center my-2">
              <div>You Pay</div>
              <div>{sourceInfo.tokenAmount + " " + sourceInfo.tokenSymbol}</div>
            </div>
            <div className="flex justify-between items-center my-2">
              <div>You Receive</div>
              <div>{targetInfo.tokenAmount + " " + targetInfo.tokenSymbol}</div>
            </div>
            {!isSameChain && (
              <>
                <div className="flex justify-between items-center my-2">
                  <div>{`Network Fee on ${sourceInfo.chainName}`}</div>
                  <div>{selectedRoute?.sourceGasEstimationUIAmount}</div>
                </div>
                <div className="flex justify-between items-center my-2">
                  <div>{`Network Fee on ${targetInfo.chainName}`}</div>
                  <div>{selectedRoute?.targetGasEstimationUIAmount}</div>
                </div>
              </>
            )}
            {isSameChain &&
            (sourceInfo.chainId === kanaChainIdList.polygon ||
              sourceInfo.chainId === kanaChainIdList.binance ||
              sourceInfo.chainId === kanaChainIdList.ethereum) ? (
              <div></div>
            ) : (
              <div className="flex justify-between items-center my-2">
                <div>{isSameChain ? "Kana Fee" : "Bridge Fee"}</div>
                <div>{kanaFee}</div>
              </div>
            )}

            <div className="flex justify-between items-center my-2">
              <div>Slippage</div>
              <div>
                <span>{slippage}</span>
                <span>%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div
              className="bg-transparent rounded-3xl border-[0.05rem] border-[#00FFFF] text-center cursor-pointer py-2.5 font-medium font-inter tracking-wider"
              onClick={() => setPreviewVisibility(false)}
            >
              <div
                className={`${
                  buttonColor ? "" : "bg-gradient"
                } bg-clip-text cursor-pointer`}
                style={
                  buttonColor
                    ? {
                        WebkitTextFillColor: "transparent",
                        backgroundColor: buttonColor,
                      }
                    : { WebkitTextFillColor: "transparent" }
                }
              >
                Cancel
              </div>
            </div>
            <div
              className="rounded-3xl text-center cursor-pointer py-2.5 font-medium text-black font-inter tracking-wider w-full bg-gradient"
              style={buttonColor ? { background: buttonColor } : {}}
              onClick={() => startSwap()}
            >
              Swap
            </div>
          </div>
        </div>
      </CustomModal>
    );
  };

  const getExplorerLink = (hash: any, chain: any) => {
    let link = "";
    switch (chain) {
      case kanaChainIdList.solana:
        link = `https://solscan.io/tx/${hash}?cluster=mainnet`;
        break;
      case kanaChainIdList.aptos:
        link = `https://explorer.aptoslabs.com/txn/${hash}?network=mainnet`;
        break;
      case kanaChainIdList.polygon:
        link = `https://polygonscan.com/tx/${hash}`;
        break;
      case kanaChainIdList.binance:
        link = `https://bscscan.com/tx/${hash}`;
        break;
      case kanaChainIdList.ethereum:
        link = `https://etherscan.io/tx/${hash}`;
        break;
    }
    return link;
  };

  const SwapModal = () => {
    try {
      const primaryColor = props?.config.containerStyle?.primaryColor;
      const buttonColor = props?.config.containerStyle?.buttonColor;
      let isSameChain = sourceInfo.chainId === targetInfo.chainId;
      let uiAmount = isSameChain
        ? selectedRoute.uiOutAmount
        : selectedRoute.uiTargetOutAmount;
      let uiDollarPrice = isSameChain
        ? selectedRoute.dollarPrice
        : selectedRoute.uiTargetDollarPrice;
      let sameChainLink = getExplorerLink(
        sameChainSwap.hash,
        sourceInfo.chainId
      );
      let sourceLink = getExplorerLink(
        sourceChainSwap.hash,
        sourceInfo.chainId
      );
      let targetLink = getExplorerLink(
        targetChainSwap.hash,
        targetInfo.chainId
      );
      let timing = isSameChain
        ? sameChainEstimationTime
        : crossChainEstimationTime;
      return (
        <CustomModal>
          <div className="p-4 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="relative rounded-full w-fit">
                  <div>
                    <img
                      className="w-9"
                      src={targetInfo.tokenImg}
                      alt="token"
                    />
                  </div>
                </div>
                <div className="ml-3 font-inter">
                  <div className="font-bold">{trimToFloor(uiAmount, 5)}</div>
                  <div className="flex text-xs text-greyText">
                    <div className="mr-2">{`$ ${trimToFloor(
                      uiDollarPrice,
                      4
                    )}`}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <img src={TimeIcon} alt="" />
                <div className="font-inter text-xs opacity-80 ml-2">
                  {timing}
                </div>
              </div>
            </div>
            {isSameChain ? (
              <div className="flex mt-6">
                <div className="mr-4 flex flex-col items-center">
                  <div className="w-full">
                    <div className="w-3 h-3 bg-[#00FFFF] rounded-full"></div>
                  </div>
                  <div className="progress-wrapper">
                    <div
                      className="progress-inner"
                      style={{
                        height: `${sameChainSwap.completionPercentage}%`,
                      }}
                    ></div>
                  </div>
                  <div className="w-full">
                    <div
                      className={`w-3 h-3 ${
                        sameChainSwap?.status === "success"
                          ? "bg-[#00FFFF]"
                          : "bg-white"
                      } rounded-full`}
                    ></div>
                  </div>
                </div>
                <div
                  className="bg-widgetPrimary mt-1 px-3 py-4 w-full rounded-xl grid grid-cols-11"
                  style={{ backgroundColor: primaryColor }}
                >
                  <>
                    {sameChainSwap?.status === "success" ? (
                      <div className="mt-1 h-8 w-8">
                        <img src={CompletedIcon} alt="" />
                      </div>
                    ) : sameChainSwap?.status === "failed" ? (
                      <div className="mt-1 h-8 w-8">
                        <img src={FailedIcon} alt="" />
                      </div>
                    ) : (
                      <div>
                        <div className="mt-1 rounded-full h-8 w-8 bg-white"></div>
                      </div>
                    )}
                  </>
                  <div className="ml-3 col-span-10">
                    <div className="font-inter text-[15px]">
                      Swap on{" "}
                      <span className="font-bold">{sourceInfo.chainName}</span>{" "}
                      via{" "}
                      <span className="font-bold">{selectedRoute.label}</span>
                    </div>
                    <div className="text-greyText text-xs">
                      {sourceInfo.tokenAmount +
                        " " +
                        sourceInfo.tokenSymbol +
                        " -> " +
                        targetInfo.tokenAmount +
                        " " +
                        targetInfo.tokenSymbol}
                    </div>
                    {sameChainSwap?.status === "success" && (
                      <>
                        <div className="flex mt-2.5 items-center">
                          <div className="text-[#00F9A9] text-sm mr-2">
                            {sameChainSwap.hash?.slice(0, 8) +
                              "..." +
                              sameChainSwap.hash?.slice(-8)}
                          </div>
                          <div
                            className="cursor-pointer flex"
                            onClick={() => {
                              copyHash(sameChainSwap.hash);
                              toast.success("Hash Copied");
                            }}
                          >
                            <img src={CopyIcon} alt="" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <a
                            href={sameChainLink}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-3xl text-xs text-center cursor-pointer px-3 py-1.5 text-white font-inter border-[1px] border-[#95859c] w-fit bg-transparent"
                          >
                            View on explorer
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex">
                  <div className="mr-4 flex flex-col items-center">
                    <div className="w-full">
                      <div className="w-3 h-3 bg-[#00FFFF] rounded-full"></div>
                    </div>
                    <div className="progress-wrapper">
                      <div
                        className="progress-inner"
                        style={{
                          height: `${sourceChainSwap.completionPercentage}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div
                    className={`grid grid-cols-11 ${
                      sourceChainRoute ? "items-start" : "items-center"
                    } bg-widgetPrimary px-3 py-4 rounded-xl w-full`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    <>
                      {sourceChainSwap?.status === "success" ? (
                        <div className="mt-1 h-8 w-8">
                          <img src={CompletedIcon} alt="" />
                        </div>
                      ) : sourceChainSwap?.status === "failed" ||
                        targetChainSwap?.status === "failed" ? (
                        <div className="mt-1 h-8 w-8">
                          <img src={FailedIcon} alt="" />
                        </div>
                      ) : (
                        <div>
                          <div className="mt-1 rounded-full h-8 w-8 bg-white"></div>
                        </div>
                      )}
                    </>
                    <div className="ml-3 col-span-10">
                      {sourceChainRoute ? (
                        <>
                          <div className="font-inter text-[15px]">
                            Swap on{" "}
                            <span className="font-bold">
                              {sourceInfo.chainName}
                            </span>{" "}
                            via{" "}
                            <span className="font-bold">
                              {sourceChainRoute.label}
                            </span>
                          </div>
                          <div className="text-greyText text-xs">
                            {sourceChainRoute.paths}
                          </div>
                        </>
                      ) : (
                        <div className="font-inter text-[15px]">
                          Transferring on{" "}
                          <span className="font-bold">
                            {selectedRoute.bridge}
                          </span>
                        </div>
                      )}
                      {sourceChainSwap?.status === "success" && (
                        <>
                          <div className="flex mt-2.5 items-center">
                            <div className="text-[#00F9A9] text-sm mr-2">
                              {sourceChainSwap.hash?.slice(0, 8) +
                                "..." +
                                sourceChainSwap.hash?.slice(-8)}
                            </div>
                            <div
                              className="cursor-pointer"
                              onClick={() => {
                                copyHash(sourceChainSwap.hash);
                                toast.success("Hash Copied");
                              }}
                            >
                              <img src={CopyIcon} alt="" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <a
                              href={sourceLink}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-3xl text-xs text-center cursor-pointer px-3 py-1.5 text-white font-inter border-[1px] border-[#95859c] w-fit bg-transparent"
                            >
                              View on explorer
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex">
                  <div className="mr-4 flex flex-col items-center">
                    <div className="w-full">
                      <div
                        className={`w-3 h-3 ${
                          sourceChainSwap?.status === "success"
                            ? "bg-[#00FFFF]"
                            : "bg-white"
                        } rounded-full`}
                      ></div>
                    </div>
                    <div className="progress-wrapper">
                      <div
                        className="progress-inner"
                        style={{
                          height: `${swapBridging.completionPercentage}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div
                    className="grid grid-cols-11 mt-3 bg-widgetPrimary px-3 py-4 rounded-xl w-full"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div>
                      {swapBridging?.status === "success" ? (
                        <div className="mt-1 h-8 w-8">
                          <img src={CompletedIcon} alt="" />
                        </div>
                      ) : swapBridging?.status === "failed" ||
                        sourceChainSwap?.status === "failed" ||
                        targetChainSwap?.status === "failed" ? (
                        <div className="mt-1 h-8 w-8">
                          <img src={FailedIcon} alt="" />
                        </div>
                      ) : (
                        <div>
                          <div className="mt-1 rounded-full h-8 w-8 bg-white"></div>
                        </div>
                      )}
                    </div>
                    <div className="ml-3 col-span-10">
                      <div className="font-inter text-[15px]">
                        Bridge from{" "}
                        <span className="font-bold">
                          {sourceInfo.chainName}
                        </span>{" "}
                        to{" "}
                        <span className="font-bold">
                          {targetInfo.chainName}
                        </span>{" "}
                        via{" "}
                        <span className="font-bold">
                          {selectedRoute.bridge}
                        </span>
                      </div>
                      <div className="text-greyText text-xs">
                        {selectedRoute?.bridgeUIAmount +
                          " " +
                          selectedRoute?.sourceBridgeTokenSymbol +
                          " -> " +
                          selectedRoute?.bridgeUIAmount +
                          " " +
                          selectedRoute?.targetBridgeTokenSymbol}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex">
                  <div className="mr-4 flex flex-col items-center">
                    <div className="w-full">
                      <div
                        className={`w-3 h-3 ${
                          swapBridging?.status === "success"
                            ? "bg-[#00FFFF]"
                            : "bg-white"
                        } rounded-full`}
                      ></div>
                    </div>
                    <div className="progress-wrapper">
                      <div
                        className="progress-inner"
                        style={{
                          height: `${targetChainSwap.completionPercentage}%`,
                        }}
                      ></div>
                    </div>
                    <div className="w-full">
                      <div
                        className={`w-3 h-3 ${
                          targetChainSwap?.status === "success"
                            ? "bg-[#00FFFF]"
                            : "bg-white"
                        } rounded-full`}
                      ></div>
                    </div>
                  </div>
                  <div
                    className={`grid grid-cols-11 ${
                      targetChainRoute ? "items-start" : "items-center"
                    } mt-3 bg-widgetPrimary px-3 py-4 rounded-xl w-full`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div>
                      {targetChainSwap?.status === "success" ? (
                        <div className="mt-1 h-8 w-8">
                          <img src={CompletedIcon} alt="" />
                        </div>
                      ) : targetChainSwap?.status === "failed" ||
                        sourceChainSwap?.status === "failed" ||
                        swapBridging?.status === "failed" ? (
                        <div className="mt-1 h-8 w-8">
                          <img src={FailedIcon} alt="" />
                        </div>
                      ) : (
                        <div>
                          <div className="mt-1 rounded-full h-8 w-8 bg-white"></div>
                        </div>
                      )}
                    </div>
                    <div className="ml-3 col-span-10">
                      {targetChainRoute ? (
                        <>
                          <div className="font-inter text-[15px]">
                            Swap on{" "}
                            <span className="font-bold">
                              {targetInfo.chainName}
                            </span>{" "}
                            via{" "}
                            <span className="font-bold">
                              {targetChainRoute.label}
                            </span>
                          </div>
                          <div className="text-greyText text-xs">
                            {targetChainRoute.paths}
                          </div>
                        </>
                      ) : (
                        <div className="font-inter text-[15px]">
                          Claiming on{" "}
                          <span className="font-bold">
                            {targetInfo.chainName}
                          </span>
                        </div>
                      )}
                      {targetChainSwap?.status === "success" && (
                        <>
                          <div className="flex mt-2.5 items-center">
                            <div className="text-[#00F9A9] text-sm mr-2">
                              {targetChainSwap.hash?.slice(0, 8) +
                                "..." +
                                targetChainSwap.hash?.slice(-8)}
                            </div>
                            <div
                              className="cursor-pointer"
                              onClick={() => {
                                copyHash(targetChainSwap.hash);
                                toast.success("Hash Copied");
                              }}
                            >
                              <img src={CopyIcon} alt="" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <a
                              href={targetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-3xl text-xs text-center cursor-pointer px-3 py-1.5 text-white font-inter border-[1px] border-[#95859c] w-fit bg-transparent"
                            >
                              View on explorer
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {sameChainSwap?.status ||
            sourceChainSwap?.status === "failed" ||
            swapBridging?.status === "failed" ||
            targetChainSwap?.status ? (
              <div className="flex justify-center mt-5">
                <div
                  className="bg-transparent flex justify-center w-fit px-5 rounded-3xl border-[0.05rem] border-[#00FFFF] text-center cursor-pointer py-1 font-medium font-inter tracking-wider"
                  onClick={() => closeSwapModal()}
                >
                  <div
                    className={`${
                      buttonColor ? "" : "bg-gradient"
                    } bg-clip-text cursor-pointer`}
                    style={
                      buttonColor
                        ? {
                            WebkitTextFillColor: "transparent",
                            backgroundColor: buttonColor,
                          }
                        : { WebkitTextFillColor: "transparent" }
                    }
                  >
                    Close
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 text-center text-greyText">
                Do not close this tab
              </div>
            )}
          </div>
        </CustomModal>
      );
    } catch (error: any) {
      console.log("Error occurred in SwapModal::" + error);
    }
  };

  const closeSwapModal = () => {
    setSwapModalVisibility(false);
    setSameChainSwap({
      status: null,
      hash: null,
      completionPercentage: 0,
    });
    setSourceChainSwap({
      status: null,
      hash: null,
      completionPercentage: 0,
    });
    setTargetChainSwap({
      status: null,
      hash: null,
      completionPercentage: 0,
    });
    setSwapBridging({
      status: null,
      completionPercentage: 0,
    });
  };

  const redeemSignatureOnChange = (value: any) => {
    if (value === "") {
      setRedeemLoading(false);
    } else {
      setRedeemLoading(true);
    }
    setRedeemSignature(value);
  };

  const RedeemView = () => {
    const primaryColor = props?.config.containerStyle?.primaryColor;
    const secondaryColor = props?.config.containerStyle?.secondaryColor;
    const buttonColor = props?.config.containerStyle?.buttonColor;
    let isSourceSolanaWalletConnected =
      redeemChain === kanaChainIdList.solana && solanaWalletConnected;
    let isSourceAptosWalletConnected =
      redeemChain === kanaChainIdList.aptos && connected;
    let isSourcePolygonWalletConnected =
      redeemChain === kanaChainIdList.polygon && address;
    let isSourceBinanceWalletConnected =
      redeemChain === kanaChainIdList.binance && address;
    let isSourceEthereumWalletConnected =
      redeemChain === kanaChainIdList.ethereum && address;
    let isTargetSolanaWalletConnected =
      redeemData.chainId === CHAIN_ID_SOLANA && solanaWalletConnected;
    let isTargetAptosWalletConnected =
      redeemData.chainId === CHAIN_ID_APTOS && connected;
    let isTargetPolygonWalletConnected =
      redeemData.chainId === CHAIN_ID_POLYGON && address;
    let isTargetBinanceWalletConnected =
      redeemData.chainId === CHAIN_ID_BSC && address;
    let isTargetEthereumWalletConnected =
      redeemData.chainId === CHAIN_ID_ETH && address;
    let solanaAccountAddress = publicKey?.toBase58();
    let aptosAccountAddress = account?.address;
    let isSourceWalletConnected =
      isSourceAptosWalletConnected ||
      isSourceSolanaWalletConnected ||
      isSourcePolygonWalletConnected ||
      isSourceBinanceWalletConnected ||
      isSourceEthereumWalletConnected;
    let isTargetWalletConnected =
      isTargetSolanaWalletConnected ||
      isTargetAptosWalletConnected ||
      isTargetPolygonWalletConnected ||
      isTargetBinanceWalletConnected ||
      isTargetEthereumWalletConnected;

    return (
      <div>
        <div className="flex justify-between items-center">
          <div className="text-[1.4rem] font-inter font-bold">Redeem</div>
          <div className="flex">
            <div
              className="bg-widgetSecondary cursor-pointer rounded-lg grid place-items-center px-3 font-bold font-inter mr-2"
              style={{ backgroundColor: secondaryColor }}
            >
              <div
                className={`${
                  buttonColor ? "" : "bg-gradient"
                } bg-clip-text cursor-pointer`}
                style={
                  buttonColor
                    ? {
                        WebkitTextFillColor: "transparent",
                        backgroundColor: buttonColor,
                      }
                    : { WebkitTextFillColor: "transparent" }
                }
                onClick={() => setRedeemViewVisibility(false)}
              >
                Swap
              </div>
            </div>
            <div
              className="bg-widgetSecondary rounded-md mr-2 cursor-pointer"
              style={{ backgroundColor: secondaryColor }}
            >
              <img src={ResetIcon} className="p-1.5" alt="reset" />
            </div>
            <div
              className="bg-widgetSecondary rounded-md cursor-pointer"
              style={{ backgroundColor: secondaryColor }}
              onClick={() => setSettingsViewVisibility(true)}
            >
              <img src={SettingsIcon} className="p-1" alt="reset" />
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <div className="text-greyText font-inter text-sm">Source</div>
          <div
            className={`${buttonColor ? "" : "bg-gradient"} ${
              redeemChain ? "cursor-pointer" : "cursor-not-allowed"
            } bg-clip-text`}
            style={
              buttonColor
                ? {
                    WebkitTextFillColor: "transparent",
                    backgroundColor: buttonColor,
                  }
                : { WebkitTextFillColor: "transparent" }
            }
            onClick={
              redeemChain
                ? () =>
                    setRedeemWalletConnectVisibility({
                      visibility: true,
                      clickedFrom: "source",
                    })
                : () => false
            }
          >
            {isSourceSolanaWalletConnected ? (
              <div className="flex items-center">
                <img
                  className="w-[1.3rem] h-[1.3rem] mr-1"
                  src={wallet?.adapter?.icon}
                  alt=""
                />
                {solanaAccountAddress?.slice(0, 4) +
                  ".." +
                  solanaAccountAddress?.slice(-4)}
              </div>
            ) : isSourceAptosWalletConnected ? (
              <div className="flex items-center">
                <img
                  className="w-[1.3rem] h-[1.3rem] mr-1"
                  src={connectedAptosWallet?.adapter?.icon}
                  alt=""
                />
                {aptosAccountAddress?.toString()?.slice(0, 4) +
                  ".." +
                  aptosAccountAddress?.toString()?.slice(-4)}
              </div>
            ) : isSourcePolygonWalletConnected ? (
              <div className="flex items-center">
                <img
                  className="w-[1.3rem] h-[1.3rem] mr-1"
                  src={connector?.id === "metaMask" ? MetaMask : Coinbase}
                  alt=""
                />
                {address?.slice(0, 4) + ".." + address?.toString()?.slice(-4)}
              </div>
            ) : isSourceBinanceWalletConnected ? (
              <div className="flex items-center">
                <img
                  className="w-[1.3rem] h-[1.3rem] mr-1"
                  src={connector?.id === "metaMask" ? MetaMask : Coinbase}
                  alt=""
                />
                {address?.slice(0, 4) + ".." + address?.toString()?.slice(-4)}
              </div>
            ) : isSourceEthereumWalletConnected ? (
              <div className="flex items-center">
                <img
                  className="w-[1.3rem] h-[1.3rem] mr-1"
                  src={connector?.id === "metaMask" ? MetaMask : Coinbase}
                  alt=""
                />
                {address?.slice(0, 4) + ".." + address?.toString()?.slice(-4)}
              </div>
            ) : (
              <div>Connect Wallet</div>
            )}
          </div>
        </div>
        <div
          className="bg-widgetPrimary mt-2 rounded-3xl p-4"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="text-greyText text-sm mb-2">Select Source Chain</div>
          <Select
            className="redeem_select"
            isSearchable={false}
            options={options}
            placeholder={"Select Chain"}
            styles={redeemColorStyles}
            value={options.find((x: any) => x.value === redeemChain)}
            onChange={(e: any) => setRedeemChain(e.value)}
          />
          <div className="text-greyText text-sm mt-4">
            Source Bridge Transaction Hash
          </div>
          <input
            autoComplete="off"
            type="text"
            id="source_tx"
            autoFocus={true}
            disabled={!redeemChain || !isSourceWalletConnected}
            placeholder="Source Tx( paste here)"
            value={redeemSignature}
            className={`bg-[#2c2533] w-full rounded-lg mt-2 mb-3 outline-0 text-white font-dm_sans px-4 py-3.5 ${
              !redeemChain || (!isSourceWalletConnected && "cursor-not-allowed")
            }`}
            onChange={(e) => redeemSignatureOnChange(e.target.value)}
          />
        </div>
        {redeemData.chainId && (
          <>
            <div className="flex justify-between mt-5">
              <div className="text-greyText font-inter text-sm">Receive</div>
              <div
                className={`${
                  buttonColor ? "" : "bg-gradient"
                } bg-clip-text cursor-pointer`}
                style={
                  buttonColor
                    ? {
                        WebkitTextFillColor: "transparent",
                        backgroundColor: buttonColor,
                      }
                    : { WebkitTextFillColor: "transparent" }
                }
                onClick={() => {
                  setRedeemWalletConnectVisibility({
                    visibility: true,
                    clickedFrom: "target",
                  });
                }}
              >
                {isTargetSolanaWalletConnected ? (
                  <div className="flex items-center">
                    <img
                      className="w-[1.3rem] h-[1.3rem] mr-1"
                      src={wallet?.adapter?.icon}
                      alt=""
                    />
                    {solanaAccountAddress?.slice(0, 4) +
                      ".." +
                      solanaAccountAddress?.slice(-4)}
                  </div>
                ) : isTargetAptosWalletConnected ? (
                  <div className="flex items-center">
                    <img
                      className="w-[1.3rem] h-[1.3rem] mr-1"
                      src={connectedAptosWallet?.adapter?.icon}
                      alt=""
                    />
                    {aptosAccountAddress?.toString()?.slice(0, 4) +
                      ".." +
                      aptosAccountAddress?.toString()?.slice(-4)}
                  </div>
                ) : isTargetPolygonWalletConnected ? (
                  <div className="flex items-center">
                    <img
                      className="w-[1.3rem] h-[1.3rem] mr-1"
                      src={connector?.id === "metaMask" ? MetaMask : Coinbase}
                      alt=""
                    />
                    {address?.slice(0, 4) +
                      ".." +
                      address?.toString()?.slice(-4)}
                  </div>
                ) : isTargetBinanceWalletConnected ? (
                  <div className="flex items-center">
                    <img
                      className="w-[1.3rem] h-[1.3rem] mr-1"
                      src={connector?.id === "metaMask" ? MetaMask : Coinbase}
                      alt=""
                    />
                    {address?.slice(0, 4) +
                      ".." +
                      address?.toString()?.slice(-4)}
                  </div>
                ) : isTargetEthereumWalletConnected ? (
                  <div className="flex items-center">
                    <img
                      className="w-[1.3rem] h-[1.3rem] mr-1"
                      src={connector?.id === "metaMask" ? MetaMask : Coinbase}
                      alt=""
                    />
                    {address?.slice(0, 4) +
                      ".." +
                      address?.toString()?.slice(-4)}
                  </div>
                ) : (
                  <div>Connect Wallet</div>
                )}
              </div>
            </div>
            <div
              className="bg-widgetPrimary mt-2 mb-2 rounded-3xl px-5 py-4"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="bg-widgetSecondary h-[4rem] px-3 rounded-2xl flex items-center cursor-not-allowed"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <div className="relative rounded-full w-fit">
                    <div>
                      <img
                        className="w-9"
                        src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                        alt="token"
                      />
                    </div>
                    <div
                      className={`absolute rounded-full bg-black right-0 bottom-0 translate-y-[25%] translate-x-[25%]`}
                    >
                      <img
                        className="w-4 h-4 p-[2px] rounded-full"
                        src={redeemData.chainImg}
                        alt="chain"
                      />
                    </div>
                    <div
                      className={`absolute rounded-full bg-black right-0 bottom-0 translate-y-[25%] translate-x-[25%]`}
                    >
                      <img
                        className="w-4 h-4 p-[2px] rounded-full"
                        src={redeemData.chainImg}
                        alt="chain"
                      />
                    </div>
                  </div>
                  <div className="ml-3 font-inter font-bold">
                    <div className="text-lg leading-4">{"USDC"}</div>
                    <div className="text-xs leading-4">
                      <span className="font-normal text-[11px]">{"on "}</span>
                      {redeemData.chainName}
                    </div>
                  </div>
                </div>
                <div>
                  <input
                    id="redeem-token-amount"
                    className="outline-0 border-0 h-full bg-transparent text-right font-inter w-full font-bold text-3xl"
                    type="text"
                    value={trimToFloor(redeemData.tokenAmount, 4)}
                    placeholder="0"
                    min="0"
                    disabled={true}
                  />
                </div>
              </div>
            </div>
          </>
        )}
        {redeemLoading ? (
          <button
            className="rounded-3xl py-2 mt-3 font-medium text-black font-inter tracking-wider w-full bg-gradient"
            style={buttonColor ? { background: buttonColor } : {}}
            id="preview_btn"
          >
            <BeatLoader color={"#2c2533"} loading={true} size={12} />
          </button>
        ) : (
          <button
            className={`rounded-3xl ${
              redeemData.chainId ? "cursor-pointer" : "cursor-not-allowed"
            } py-2 mt-3 font-medium text-black font-inter tracking-wider w-full bg-gradient`}
            style={buttonColor ? { background: buttonColor } : {}}
            id="preview_btn"
            onClick={() =>
              isTargetWalletConnected
                ? setRedeemModalVisibility(true)
                : () => false
            }
          >
            {!redeemChain
              ? "Select source chain"
              : !isSourceWalletConnected
              ? "Connect Source Wallet"
              : !redeemSignature
              ? "Enter transaction hash"
              : isTargetWalletConnected
              ? "Preview"
              : "Connect Target Wallet"}
          </button>
        )}
      </div>
    );
  };

  const setSlippageValue = (e: any) => {
    if (e.target.value === "") {
      setSlippage(0);
      return;
    }
    if (e.target.value < 101 && e.target.value.toString().length < 4)
      setSlippage(e.target.value);
  };

  const SettingsModal = () => {
    const primaryColor = props?.config.containerStyle?.primaryColor;
    const secondaryColor = props?.config.containerStyle?.secondaryColor;
    return (
      <CustomModal>
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-white font-inter font-bold text-xl">
              Settings
            </div>
            <img
              className="cursor-pointer"
              onClick={() => setSettingsViewVisibility(false)}
              src={CloseIcon}
              alt=""
            />
          </div>
          <div className="flex justify-between items-center mt-6">
            <div className="text-white font-inter">Slippage tolerance</div>
            <div className="flex">
              <div
                className={`p-1 px-2 text-white rounded-lg cursor-pointer ${
                  slippage === 0.5 && slippageInputDisabled
                    ? "bg-widgetPrimary"
                    : "bg-widgetSecondary"
                }`}
                style={
                  slippage === 0.5 && slippageInputDisabled
                    ? primaryColor
                      ? { background: primaryColor }
                      : {}
                    : secondaryColor
                    ? { background: secondaryColor }
                    : {}
                }
                onClick={() => {
                  setSlippage(0.5);
                  setSlippageInputDisabled(true);
                }}
              >
                0.5%
              </div>
              <div
                className={`p-1 px-2 mx-2 text-white rounded-lg cursor-pointer ${
                  slippage === 1 && slippageInputDisabled
                    ? "bg-widgetPrimary"
                    : "bg-widgetSecondary"
                }`}
                style={
                  slippage === 1 && slippageInputDisabled
                    ? primaryColor
                      ? { background: primaryColor }
                      : {}
                    : secondaryColor
                    ? { background: secondaryColor }
                    : {}
                }
                onClick={() => {
                  setSlippage(1);
                  setSlippageInputDisabled(true);
                }}
              >
                1%
              </div>
              <div
                className={`p-1 px-2 text-white rounded-lg cursor-pointer ${
                  slippage === 2 && slippageInputDisabled
                    ? "bg-widgetPrimary"
                    : "bg-widgetSecondary"
                }`}
                style={
                  slippage === 2 && slippageInputDisabled
                    ? primaryColor
                      ? { background: primaryColor }
                      : {}
                    : secondaryColor
                    ? { background: secondaryColor }
                    : {}
                }
                onClick={() => {
                  setSlippage(2);
                  setSlippageInputDisabled(true);
                }}
              >
                2%
              </div>
              <div
                className={`p-1 px-2 text-white rounded-lg ml-2 cursor-pointer ${
                  !slippageInputDisabled
                    ? "bg-widgetPrimary"
                    : "bg-widgetSecondary"
                }`}
                style={
                  !slippageInputDisabled
                    ? primaryColor
                      ? { background: primaryColor }
                      : {}
                    : secondaryColor
                    ? { background: secondaryColor }
                    : {}
                }
                onClick={() => setSlippageInputDisabled(false)}
              >
                Custom
              </div>
            </div>
          </div>
          <div
            className="bg-widgetPrimary mt-4 rounded-3xl justify-between flex px-4 py-3"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="text-greyText">Slippage</div>
            <div className="text-white flex">
              <input
                className="outline-0 border-0 h-full bg-transparent text-right font-inter text-lg"
                disabled={slippageInputDisabled}
                type="number"
                id="target-token-amount"
                autoFocus={true}
                value={slippage}
                onChange={(e: any) => setSlippageValue(e)}
                placeholder="0"
                autoComplete="off"
                min={0}
                max={100}
                maxLength={3}
              />
              <span>%</span>
            </div>
          </div>
          <div>
            {slippage < 0.5 && (
              <div className="mt-3 text-sm text-greyText">
                Less Slippage may cause slippage error
              </div>
            )}
            {slippage > 2 && (
              <div className="mt-3 text-sm text-greyText">
                Warning, Slippage is high
              </div>
            )}
          </div>
        </div>
      </CustomModal>
    );
  };

  const primaryColor = props?.config.containerStyle?.primaryColor;
  let buttonColor = props?.config.containerStyle?.buttonColor;
  let isSameChain = sourceInfo.chainId === targetInfo.chainId;
  let visibleRoutes = showAllRoutes
    ? availableRoutes
    : availableRoutes?.slice(0, 4);
  return (
    <div className="bg-black grid place-items-center h-full min-h-screen">
      <div className={`flex ${isRoutesVisible ? "gap-5" : ""}`}>
        <div
          className="text-white bg-widgetBg p-5 h-fit min-h-[20rem] rounded-3xl border-2 border-[#625965] mt-10 w-[25rem] sm:w-[30rem]"
          style={{
            backgroundColor: props?.config?.containerStyle?.backgroundColor,
          }}
        >
          {chainAndTokenListVisibility.visibility ? (
            <ChainAndTokenListView />
          ) : walletConnectVisibility.visibility ? (
            <WalletConnectView />
          ) : redeemWalletConnectVisibility.visibility ? (
            <RedeemWalletConnectView />
          ) : redeemViewVisibility ? (
            <RedeemView />
          ) : (
            <SwapView />
          )}

          {/* transaction segment for etherspot */}
          <EtherspotBatches>
            <EtherspotBatch>
              {swapIx.map((element: any) => (
                <EtherspotTransaction
                  data={element?.data}
                  to={element?.to}
                  value={String(getUiAmount(Number(element?.value), 18))}
                ></EtherspotTransaction>
              ))}
            </EtherspotBatch>
          </EtherspotBatches>
        </div>
        {isRoutesVisible && Number(sourceInfo.tokenAmount) > 0 && (
          <div ref={routesRef}>
            <div
              className="text-white bg-widgetBg h-fit p-5 rounded-3xl border-2 border-[#625965] mt-10 w-[30rem]"
              style={{
                backgroundColor: props?.config.containerStyle?.backgroundColor,
              }}
            >
              {isSameChain ? (
                <>
                  <div className="text-center text-greyText font-inter mb-4">{`Top ${availableRoutes?.length} Routes Available`}</div>
                  <div className="max-h-[30rem] overflow-scroll relative py-1.5">
                    <div className="absolute top-0 flex bg-[#1A272F] px-3 py-1.5 rounded-lg">
                      <img className="mr-2" src={RecommendedIcon} alt="" />
                      <div
                        className="bg-gradient bg-clip-text cursor-pointer font-inter text-xs"
                        style={
                          buttonColor
                            ? {
                                WebkitTextFillColor: "transparent",
                                backgroundColor: buttonColor,
                              }
                            : { WebkitTextFillColor: "transparent" }
                        }
                      >
                        Recommended
                      </div>
                    </div>
                    {(visibleRoutes || []).map((route: any, index: any) => {
                      return (
                        <div
                          id={`route${index}`}
                          className="rounded-3xl border-transparent border-[0.05rem] my-2 cursor-pointer"
                          style={
                            selectedRoute.index === index
                              ? {
                                  background:
                                    "linear-gradient(271.77deg, #00FFFF -9.9%, #00F9A9 155.61%) border-box",
                                }
                              : {}
                          }
                          onClick={() => setSelectedRoute(route)}
                          key={`route${index}`}
                        >
                          <div
                            className="bg-widgetPrimary px-5 py-6 rounded-3xl"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex">
                                <div className="relative rounded-full w-fit">
                                  <img
                                    className="w-9"
                                    src={targetInfo.tokenImg}
                                    alt="token"
                                  />
                                  <div
                                    className={`absolute rounded-full bg-black right-0 bottom-0 translate-y-[25%] translate-x-[25%]`}
                                  >
                                    <img
                                      className="w-4 h-4 p-[2px] rounded-full"
                                      src={targetInfo.chainImg}
                                      alt="chain"
                                    />
                                  </div>
                                </div>
                                <div className="ml-3 font-inter">
                                  <div className="font-bold">
                                    {trimToFloor(route.uiOutAmount, 5)}
                                  </div>
                                  <div className="flex text-xs text-greyText">
                                    {/* <div className="mr-2">{`$ ${trimToFloor(
                                                                            route.dollarPrice
                                                                        )}`}</div> */}
                                    <div className="mr-[15px]">
                                      {route.paths}
                                    </div>
                                    {/* <div>BridgeName</div> */}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-baseline">
                                <img src={TimeIcon} alt="" />
                                <div className="font-inter text-sm opacity-80 ml-1">
                                  {sameChainEstimationTime}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {availableRoutes?.length > 4 && !showAllRoutes && (
                    <div
                      className="bg-widgetPrimary p-5 cursor-pointer rounded-3xl flex justify-center"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => setShowAllRoutes(true)}
                    >
                      <div className="font-inter mr-2 font-bold">See more</div>
                      <img src={DropdownIcon} alt="" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center text-greyText font-inter mb-4">{`Top ${crossChainRoutes?.length} Routes Available`}</div>
                  <div className="max-h-[30rem] overflow-scroll relative py-1.5">
                    <div className="absolute top-0 flex bg-[#1A272F] px-3 py-1.5 rounded-lg">
                      <img className="mr-2" src={RecommendedIcon} alt="" />
                      <div
                        className="bg-gradient bg-clip-text cursor-pointer font-inter text-xs"
                        style={
                          buttonColor
                            ? {
                                WebkitTextFillColor: "transparent",
                                backgroundColor: buttonColor,
                              }
                            : { WebkitTextFillColor: "transparent" }
                        }
                      >
                        Recommended
                      </div>
                    </div>
                    {(crossChainRoutes || []).map((route: any, index: any) => {
                      console.log(
                        sourceChainRoute,
                        targetChainRoute,
                        "skdnljd"
                      );
                      let sourcePath =
                        sourceInfo.chainId === kanaChainIdList.solana ||
                        sourceInfo.chainId === kanaChainIdList.aptos
                          ? sourceChainRoute?.routePath
                          : sourceChainRoute?.paths;
                      let targetPath =
                        targetInfo.chainId === kanaChainIdList.solana ||
                        targetInfo.chainId === kanaChainIdList.aptos
                          ? targetChainRoute?.routePath
                          : targetChainRoute?.paths;
                      return (
                        <div
                          className="rounded-3xl border-transparent border-[0.05rem] my-2 cursor-pointer"
                          style={
                            selectedRoute.index === index
                              ? {
                                  background:
                                    "linear-gradient(271.77deg, #00FFFF -9.9%, #00F9A9 155.61%) border-box",
                                }
                              : {}
                          }
                          onClick={() => setSelectedRoute(route)}
                          key={index}
                        >
                          <div
                            className={`bg-widgetPrimary px-5 py-6 rounded-3xl`}
                            style={{ backgroundColor: primaryColor }}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-start">
                                <div className="relative rounded-full w-fit">
                                  <img
                                    className="w-9"
                                    src={targetInfo.tokenImg}
                                    alt="token"
                                  />
                                  <div
                                    className={`absolute rounded-full bg-black right-0 bottom-0 translate-y-[25%] translate-x-[25%]`}
                                  >
                                    <img
                                      className="w-4 h-4 p-[2px] rounded-full"
                                      src={targetInfo.chainImg}
                                      alt="chain"
                                    />
                                  </div>
                                </div>
                                <div className="ml-3 font-inter">
                                  <div className="font-bold">
                                    {trimToFloor(route?.uiTargetOutAmount, 5)}
                                  </div>
                                  <div className="text-xs text-greyText mr-[18px]">
                                    {/* <div className="mr-2">{`$ ${trimToFloor(
                                                                            route.uiTargetDollarPrice
                                                                        )}`}</div> */}
                                    {isObjectNonEmpty(route?.sourceRoute) ? (
                                      <span className="whitespace-nowrap">
                                        {sourcePath + " -> "}
                                      </span>
                                    ) : (
                                      <span className="whitespace-nowrap">
                                        {sourceInfo.tokenSymbol + " -> "}
                                      </span>
                                    )}
                                    <span className="toolTip">
                                      <img
                                        className="w-5 h-5 mx-1 pt-[6px]"
                                        src={wormhole}
                                        alt=""
                                      />
                                      <span className="tooltipText">
                                        Wormhole
                                      </span>
                                    </span>
                                    {isObjectNonEmpty(route?.targetRoute) ? (
                                      <span>
                                        {targetPath
                                          ?.split(" ")
                                          .splice(1)
                                          .join(" ")}
                                      </span>
                                    ) : (
                                      <span>
                                        {" -> " + targetInfo.tokenSymbol}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-baseline whitespace-nowrap">
                                <img src={TimeIcon} alt="" />
                                <div className="font-inter text-sm opacity-80 ml-1">
                                  {crossChainEstimationTime}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {isPreviewVisible && <RoutesPreviewView />}
      {isSwapModalVisible && SwapModal()}
      {isRedeemModalVisible && (
        <RedeemModal
          redeemData={redeemData}
          properties={props}
          redeemLoading={redeemLoading}
          setRedeemModalVisibility={setRedeemModalVisibility}
          setRedeemLoading={setRedeemLoading}
          redeemSignature={redeemSignature}
          redeemChain={redeemChain}
        />
      )}
      {isSettingsViewVisible && <SettingsModal />}
    </div>
  );
};

export default KanaWidget;
