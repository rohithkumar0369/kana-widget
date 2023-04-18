import axios from "axios";
import { AptosClient, HexString } from "aptos";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { toast } from "react-toastify";
import WalletClient from "aptos-wallet-api/src/wallet-client";
import { Sdk, NetworkNames } from 'etherspot';

async function retry<T, A extends any[]>(operation: (...args: A) => Promise<T>, ...args: A): Promise<T> {
  let retries = 0;
  while (retries < 20) {
    try {
      const result = await operation(...args);
      if (result !== undefined) {
        return result;
      }
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed: ${error}`);
    }
    retries++;
  }
  throw new Error('Max retries exceeded.');
}


const etherspotSdkPOL = new Sdk('0x50ac1318ff914ce755a6fd887ac663cae55e7e866a972e23e10ee384cd9dcecb', {
  networkName: 'matic' as NetworkNames,
});

const etherspotsdkBSC =  new Sdk('0x50ac1318ff914ce755a6fd887ac663cae55e7e866a972e23e10ee384cd9dcecb', {
  networkName: 'bsc' as NetworkNames,
}); 

const APTOS_NETWORK_ID = "1";
const MAINNET_NODE_URL = "https://aptos-mainnet.nodereal.io/v1/5a91ee76b3fc4f31b38aa3130d0ae3c8/v1";
const TESTNET_NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
const FAUCET_URL = "https://faucet.testnet.aptoslabs.com/";
const evm_balance_url = `https://ag.kanalabs.io/dev/getEVMTokenBalance`;


const fetchBatchDetails = async(batchHash:any, etherspotSdk:any) =>{
  const response = await etherspotSdk.getGatewaySubmittedBatch({
    hash: batchHash,
  });
  if(response.transaction){
    console.log("response",response.transaction)
    console.log("transaction got submitted");
    return response.transaction.hash;
  } else{
    console.log("transaction is still queued");
    throw new Error('transaction is still queued');
  }
}
export const getPolygonHashFromBatchHash = async (batchHash:any) => {
  try{
    let hash = await retry(fetchBatchDetails,batchHash,etherspotSdkPOL);
    return hash ;
  }
  catch(err:any){
     console.log(err)
     return batchHash
  }
}

export const getBSCHashFromBatchHash = async (batchHash:any) => {
  try{
    let hash = await retry(fetchBatchDetails,batchHash,etherspotsdkBSC);
    return hash ;
  }
  catch(err:any){
     console.log(err)
     return batchHash
  }
}

export const getSolanaRpcConnection = () => {
  return new Connection(
    "https://twilight-powerful-river.solana-mainnet.discover.quiknode.pro/e16ed09d58ff6eb332da2aa6706c05391019a1a6/",
    {
      wsEndpoint:
        "wss://twilight-powerful-river.solana-mainnet.discover.quiknode.pro/e16ed09d58ff6eb332da2aa6706c05391019a1a6/",
      commitment: "confirmed",
    }
  );
};

export const getAptosRpcEndPoint = () => {
  const MAINNET_NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
  return new AptosClient(MAINNET_NODE_URL);
};

export const sleep = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

export const getTokenDecimals = async function (connection: Connection, mint: PublicKey) {
  const tokenSupply = await connection.getTokenSupply(mint);
  const decimal = tokenSupply.value.decimals;
  return decimal;
};

export const getDollarPriceBySymbol = async (tokenSymbol: string) => {
  const { filteredTokenList } = await getFilteredPriceList();
  let dollarPrice = 0;
  if (filteredTokenList.length > 0) {
    const filteredToken = filteredTokenList.find((x: any) => x.symbol === tokenSymbol);
    if (filteredToken) {
      dollarPrice = Number(filteredToken.dollar_price);
    }
  }
  return dollarPrice;
};

export const getFilteredPriceList = async () => {
  const filteredList = await axios
    .get("https://ag.kanalabs.io/getTokenData/getTokenList")
    .then((response) => {
      return response.data;
    })
    .catch(async (error) => {
      const refreshFilteredList = await axios
        .get("https://ag.kanalabs.io/getTokenData/refreshToken")
        .then(async () => {
          const filteredList: any = await getFilteredPriceList();
          return filteredList;
        })
        .catch((error) => {
          console.log("Error in getrefreshFilteredList: ", error);
          return [];
        });
      console.log("Error in getFilteredPriceList: ", error);
      return refreshFilteredList;
    });
  return filteredList;
};

export function getUiAmount(number: number, tokenDecimal: number) {
  return number / Math.pow(10, tokenDecimal);
}

export const getEvmStructuredRoutes = async (routes: any, tokensList: any) => {
    let finalArr: any = [];
    (routes || []).map(async (route: any, index: any) => {
        let obj: any = {};
        obj.index = index;
        obj.outputValue = Number(route.toTokenAmount);
        obj.minimumReceivedAmount = Number(route.withSlippage);
        obj.data = route;
        obj.label = '';
        obj.paths = '';
        (route.protocols[0] || []).map((marketInfo: any, index: any) => {
            let isLastIndex = route.protocols[0].length - 1 === index;
            let isFirstIndex = index === 0;
            //Need input token for first index only
            let inputTokenSymbol = isFirstIndex
                ? (tokensList || []).find(
                        (x: any) =>
                            String(x?.address).toLocaleLowerCase() ===
                            String(marketInfo[0].fromTokenAddress).toLocaleLowerCase()
                    )?.symbol
                : '';

            let outputTokenSymbol = (tokensList || []).find(
                (x: any) => x?.address.toLocaleLowerCase() === marketInfo[0].toTokenAddress.toLocaleLowerCase()
            )?.symbol;
            obj.label =
                obj.label + marketInfo[0].name + (!isLastIndex && route.protocols[0].length > 1 ? ' X ' : '');
            obj.paths = obj.paths + (isFirstIndex ? inputTokenSymbol : '') + ' -> ' + outputTokenSymbol;
            isFirstIndex && (obj.inputTokenAddress = marketInfo[0].fromTokenAddress);
            obj.outputTokenAddress = marketInfo[0].toTokenAddress;
        });
        finalArr.push(obj);
    });

  return finalArr;
};

export const getAptosStructuredRoutes = async (routes: any, aptosTokensList: any) => {
  let finalArr: any = [];
  (routes || []).map(async (route: any, index: any) => {
    let obj: any = {};
    obj.index = index;
    obj.outputValue = route.outputAmount;

    obj.minimumReceivedAmount =
      Number(route.outAmountWithSlippage) - (Number(route.kanaFee) + Number(route.integratorFee));

    obj.expectedAmount =
      Number(route.outputAmount) - (Number(route.kanaFee) + Number(route.integratorFee)); //Need clarity
    obj.kanaFee = route.kanaFee;
    obj.integratorFee = route.integratorFee;
    obj.data = route;
    obj.label = "";
    obj.paths = "";
    (route.marketInfos || []).map((marketInfo: any, index: any) => {
      let isLastIndex = route.marketInfos.length - 1 === index;
      let isFirstIndex = index === 0;
      //Need input token for first index only
      let inputTokenSymbol = isFirstIndex
        ? (aptosTokensList || []).find((x: any) => x?.address === marketInfo.coinX)?.symbol
        : "";
      let outputTokenSymbol = (aptosTokensList || []).find(
        (x: any) => x?.address === marketInfo.coinY
      )?.symbol;

      obj.label =
        obj.label + marketInfo.amm + (!isLastIndex && route.marketInfos.length > 1 ? " X " : "");
      obj.paths = obj.paths + (isFirstIndex ? inputTokenSymbol : "") + " -> " + outputTokenSymbol;
      isFirstIndex && (obj.inputTokenAddress = marketInfo.coinX);
      obj.outputTokenAddress = marketInfo.coinY;
    });
    finalArr.push(obj);
  });
  return finalArr;
};

export const getSolanaStructuredRoutes = async (routes: any, solanaTokensList: any) => {
  let finalArr: any = [];
  (routes || []).map(async (route: any, mainIdx: any) => {
    let obj: any = {};
    obj.index = mainIdx;
    obj.outputValue = route.outAmount;
    obj.data = route;
    obj.outAmountWithSlippage = route.outAmount;
    obj.label = "";
    obj.paths = "";

    (route.marketInfos || []).map((market: any, index: any) => {
      let isLastIndex = route.marketInfos.length - 1 === index;
      let isFirstIndex = index === 0;
      let inputToken = isFirstIndex
        ? (solanaTokensList || [])?.find((x: any) => x?.address === market?.inputMint)?.symbol
        : "";
      let outputToken = (solanaTokensList || [])?.find(
        (x: any) => x?.address === market?.outputMint
      )?.symbol;

      obj.label =
        obj.label + market.label + (!isLastIndex && route.marketInfos.length > 1 ? " X " : "");
      obj.paths = obj.paths + (isFirstIndex ? inputToken : "") + " -> " + outputToken;
      isFirstIndex && (obj.inputTokenAddress = market.inputMint);
      obj.outputTokenAddress = market.outputMint;
      obj.kanaFee = market?.platformFee?.amount;
    });
    finalArr.push(obj);
  });

  return finalArr;
};

export const trimToFloor = (value: any, toFloor: number = 7) => {
  value = Math.floor(value * Math.pow(10, toFloor)) / Math.pow(10, toFloor);
  if (Math.abs(value) < 1.0) {
    let e = parseInt(value.toString().split("e-")[1]);
    if (e) {
      value *= Math.pow(10, e - 1);
      value = "0." + new Array(e).join("0") + value.toString().substring(2);
    }
  } else {
    let e = parseInt(value.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      value /= Math.pow(10, e);
      value += new Array(e + 1).join("0");
    }
  }
  return value;
};

export async function getAllSolanaTokenBalance(address: string, tokenList: any) {
  const tokenAccountInfos = await getSolanaRpcConnection().getParsedTokenAccountsByOwner(
    new PublicKey(address),
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );
  const nativeSolBalance = await getSolanaRpcConnection().getBalance(new PublicKey(address));
  const tokenDataWithBalance = tokenAccountInfos.value.map((item: any) => {
    return {
      mint: item.account.data.parsed?.info?.mint,
      balance: item.account.data.parsed?.info?.tokenAmount,
    };
  });
  tokenList?.forEach(function (element: { address: any; balance: any }) {
    if (element) {
      const data = tokenDataWithBalance?.find((item) => item.mint === element?.address);
      if (element.address === "So11111111111111111111111111111111111111112") {
        element.balance = {
          amount: nativeSolBalance,
          decimals: 0,
          uiAmount: nativeSolBalance / LAMPORTS_PER_SOL,
          uiAmountString: nativeSolBalance / LAMPORTS_PER_SOL,
        };
      } else if (data === undefined) {
        element.balance = {
          amount: 0,
          decimals: 0,
          uiAmount: 0,
          uiAmountString: 0,
        };
      } else {
        element.balance = data?.balance;
      }
    }
  });
  tokenList?.sort((a: { balance: { amount: number } }, b: { balance: { amount: number } }) => {
    return b?.balance?.amount - a?.balance?.amount;
  });
  return { success: true, data: tokenList };
}

export async function getAllAptosTokenBalance(account: any, tokenList: any) {
  try {
    let walletClient;
    if (APTOS_NETWORK_ID === "1") {
      walletClient = new WalletClient(MAINNET_NODE_URL, FAUCET_URL);
    } else {
      walletClient = new WalletClient(TESTNET_NODE_URL, FAUCET_URL);
    }

    let coinStoreType = "0x1::coin::CoinStore";
    let res = await walletClient.balance(account.address);
    let amount = 0;
    if (res["success"]) {
      let balance = res["balances"];
      tokenList = tokenList.map((item: any) => {
        const tok = coinStoreType + "<" + item.address + ">";
        const obj = balance.find((e: any) => e.coin === tok);
        if (obj) {
          amount = getUiAmount(obj.value, item.decimals);
          item["isAvailable"] = true;
          item["balance"] = amount;
        } else {
          item["isAvailable"] = false;
          item["balance"] = 0;
        }
        return item;
      });
      tokenList.sort((a: { balance: any }, b: { balance: any }) => {
        return b?.balance - a?.balance;
      });
      return { success: true, data: tokenList };
    } else {
      return { success: false, data: [] };
    }
  } catch (err) {
    //error log
  }
}

// export async function getAllEVMTokenBalance(account: any, tokenList: Array<any>, chainId: number) {
//     try {
//       console.log("updaitng balalnce",{account,chainId})
      
//         let res = await axios.post(evm_balance_url, {
//             address: account,
//             chainId: chainId
//         });

//     let tokenData = res.data;
//     if (tokenData) {
//       let nativeTokenBalance = tokenData.nativeBalance.balance;
//       let tokenBalanceList = tokenData.tokenBalances;

//       tokenList.forEach(function (element: { address: any; balance: any; uiAmountString: any }) {
//         if (element) {
//           const data = tokenBalanceList.find(
//             (item: any) =>
//               String(item.token_address).toLocaleLowerCase() ===
//               String(element?.address).toLocaleLowerCase()
//           );
//           if (data) {
//             element.balance = data?.balance;
//             element.uiAmountString = String(
//               getUiAmount(Number(data?.balance), data.decimals).toFixed(4)
//             );
//           } else if (
//             element?.address === "0x0000000000000000000000000000000000000000" ||
//             element?.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
//           ) {
//             element.balance = nativeTokenBalance;
//             element.uiAmountString = String(getUiAmount(Number(nativeTokenBalance), 18).toFixed(4));
//           } else {
//             element.balance = 0;
//             element.uiAmountString = "0";
//           }
//         }
//       });

//       return { success: true, data: tokenList };
//     } else {
//       return { success: false, data: [] };
//     }
//   } catch (err) {
//     console.log(err);
//     return { success: false, data: [] };
//   }
// }

export async function getAllEVMTokenBalance(account: any, tokenList: Array<any>, chainId: number) {
  console.log("🚀 ~ file: Helper.tsx:293 ~ getAllPolygonTokenBalance ~ chainId:", chainId)
  console.log("🚀 ~ file: Helper.tsx:293 ~ getAllPolygonTokenBalance ~ account:", account)
  try {
      let res = await axios.post(evm_balance_url, {
        address: account,
        chainId: chainId
      }, {
        headers: {
          'apikey': 'IaXtxTgompESxFXBKSlHsEfnJTtdyV'
        }
      });

  let tokenData = res.data.data;
  if (tokenData) {
    let nativeTokenBalance = tokenData.find(
      (item: any) =>
        (String(item.contract_address).toLocaleLowerCase() ===  "0x0000000000000000000000000000000000000000") ||
         ( String(item.contract_address).toLocaleLowerCase() ===  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") || 
        ( String(item.contract_address).toLocaleLowerCase() ===   "0x0000000000000000000000000000000000001010")
    );
    
    tokenList.forEach(function (element: { address: any; balance: any; uiAmountString: any }) {
      if (element) {
        const data = tokenData.find(
          (item: any) =>
            String(item.contract_address).toLocaleLowerCase() ===
            String(element?.address).toLocaleLowerCase()
        );
        if (data) {
          element.balance = data?.balance;
          if( element?.address === "0xa1a7feeD29EbFa38079D943486c23f401939Ce80"){
            element.uiAmountString = String(
              getUiAmount(Number(data?.balance), 6).toFixed(4)
            );
          }else {
            element.uiAmountString = String(
              getUiAmount(Number(data?.balance), data.contract_decimals).toFixed(4)
            );
          }
        } else if (
          element?.address === "0x0000000000000000000000000000000000000000" ||
          element?.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        ) {
          console.log(nativeTokenBalance.balance)
          element.balance = nativeTokenBalance.balance;
          element.uiAmountString = String(getUiAmount(Number(nativeTokenBalance.balance), 18).toFixed(4));
        } else {
          element.balance = 0;
          element.uiAmountString = "0";
        }
      }
    });
    return { success: true, data: tokenList };
  } else {
    return { success: false, data: [] };
  }
} catch (err) {
  console.log(err);
  return { success: false, data: [] };
}
}

export const getCrossChainSolanaRoute = async (route: any, solanaTokensList: any) => {
  let obj: any = {};
  (route.marketInfos || []).map((market: any, index: any) => {
    let inputToken = solanaTokensList?.find((x: any) => x?.address === market.inputMint);
    let outputToken = solanaTokensList?.find((x: any) => x?.address === market.outputMint);
    obj.routePath = "";
    obj.paths = "";
    if (index === 0) {
      if (market.firstAmm) {
        obj.label = market.firstAmm.label;
        if (market.secondAmm) {
          obj.label = obj.label + " X " + market.secondAmm.label;
          if (market.thirdAmm) {
            obj.label = obj.label + " X " + market.thirdAmm.label;
          }
        }
      } else {
        obj.label = market.label;
      }

      obj.paths =
        trimToFloor(getUiAmount(Number(market.inAmount), inputToken?.decimals), 4) +
        " " +
        inputToken?.symbol +
        " -> " +
        trimToFloor(getUiAmount(Number(market.outAmount), outputToken?.decimals), 4) +
        " " +
        outputToken?.symbol;
      obj.routePath = obj.routePath + inputToken?.symbol + ' -> ' + outputToken?.symbol;
      obj.inputTokenAddress = market.inputMint;
      obj.outputTokenAddress = market.outputMint;
    } else {
      obj.label = obj.label + " X " + market.label;
      obj.paths =
        obj.paths +
        " -> " +
        trimToFloor(getUiAmount(Number(market.outAmount), outputToken?.decimals), 4) +
        " " + outputToken?.symbol;
      obj.routePath = obj.routePath + ' -> ' + outputToken?.symbol;
      obj.outputTokenAddress = market.outputMint;
    }
  });
  obj.outputValue = route.outAmount;
  obj.data = route;
  obj.kanaFee = 0;
  obj.outAmountWithSlippage = route.otherAmountThreshold;
  return obj;
};

export const getCrossChainAptosRoute = async (route: any, aptosTokensList: any) => {
  let obj: any = {};
  obj.outputValue = route.outputAmount;
  obj.minimumReceivedAmount =
    Number(route.outAmountWithSlippage) - (Number(route.kanaFee) + Number(route.integratorFee));
  obj.expectedAmount =
    Number(route.outputAmount) - (Number(route.kanaFee) + Number(route.integratorFee));
  obj.kanaFee = route.kanaFee;
  obj.integratorFee = route.integratorFee;
  obj.data = route;
  obj.label = "";
  obj.paths = "";
  obj.routePath = "";

  (route.marketInfos || []).map((marketInfo: any, index: any) => {
    let isLastIndex = route.marketInfos.length - 1 === index;
    let isFirstIndex = index === 0;
    //Need input token for first index only
    let inputToken = isFirstIndex
      ? (aptosTokensList || []).find((x: any) => x.address === marketInfo.coinX)
      : "";
    let outputToken = (aptosTokensList || []).find((x: any) => x.address === marketInfo.coinY);

    obj.label =
      obj.label + marketInfo.amm + (!isLastIndex && route.marketInfos.length > 1 ? " X " : "");
    obj.paths =
      obj.paths +
      (isFirstIndex
        ? trimToFloor(getUiAmount(Number(marketInfo.inputAmount), inputToken?.decimals), 4) +
          " " +
          inputToken?.symbol
        : "") +
      " -> " +
      (trimToFloor(getUiAmount(Number(marketInfo.outputAmount), outputToken?.decimals), 4) +
        " " +
        outputToken?.symbol);
    obj.routePath = obj.routePath + (isFirstIndex ? inputToken?.symbol : '') + ' -> ' + outputToken?.symbol;
    isFirstIndex && (obj.inputTokenAddress = marketInfo.coinX);
    obj.outputTokenAddress = marketInfo.coinY;
  });

  return obj;
};

export const getCrossChainEvmRoute = async (route: any, polygonTokensList: any) => {
  let obj: any = {};
  obj.outputValue = Number(route.toTokenAmount);
  obj.minimumReceivedAmount = Number(route.withSlippage);
  // obj.expectedAmount = Number(route.outputAmount) - (Number(route.kanaFee) + Number(route.integratorFee));
  obj.kanaFee = route.kanaFee;
  obj.integratorFee = route.integratorFee;
  obj.data = route;
  obj.label = "";
  obj.paths = "";
  (route.protocols[0] || []).map((marketInfo: any, index: any) => {
    let isLastIndex = route.protocols[0].length - 1 === index;
    let isFirstIndex = index === 0;
    //Need input token for first index only
    let inputTokenSymbol = isFirstIndex
      ? (polygonTokensList || []).find(
          (x: any) =>
            String(x?.address).toLocaleLowerCase() ===
            String(marketInfo[0].fromTokenAddress).toLocaleLowerCase()
        )?.symbol
      : "";

    let outputTokenSymbol = (polygonTokensList || []).find(
      (x: any) =>
        x?.address.toLocaleLowerCase() === marketInfo[0].toTokenAddress.toLocaleLowerCase()
    )?.symbol;

    obj.label =
      obj.label + marketInfo[0].name + (!isLastIndex && route.protocols[0].length > 1 ? " X " : "");
    obj.paths = obj.paths + (isFirstIndex ? inputTokenSymbol : "") + " -> " + outputTokenSymbol;
    isFirstIndex && (obj.inputTokenAddress = marketInfo[0].fromTokenAddress);
    obj.outputTokenAddress = marketInfo[0].toTokenAddress;
  });

  return obj;
};

export const isObjectNonEmpty = (data: any): boolean => {
  return data && typeof data == "object" && Object.keys(data).length > 0 ? true : false;
};

export const validateSolAddress = async (publickey: string, connection: Connection) => {
  try {
    let pubkey = new PublicKey(publickey);
    let valid = await connection.getAccountInfo(pubkey);
    if (valid == null) {
      throw new Error(`Solana Publickey(Address) is invalid or Not Initialized`);
    }
  } catch (error: any) {
    throw new Error(`Solana Publickey(Address) is invalid or Not Initialized`);
  }
};

export const validateAptAddress = async (hexAddress: any, client: AptosClient) => {
  try {
    await client.getAccount(new HexString(hexAddress));
  } catch (error: any) {
    throw new Error(`Aptos HexString(Address) is invalid or Not Initialized`);
  }
};

export const preventPasteNegativeNumber = (e: any) => {
  const clipboardData = e.clipboardData || (window as any).clipboardData;
  const value = clipboardData.getData("text");
  if (!value || value.includes("-")) {
    e.preventDefault();
  } else {
    const pastedData = parseFloat(value);
    if (pastedData < 0) {
      e.preventDefault();
    }
  }
};

export const getAptosNativeBalance = async (address: any) => {
  const coinStoreType = "0x1::coin::CoinStore";
  let resources = await getAptosRpcEndPoint().getAccountResources(new HexString(address));
  let coinResources = resources.filter((r: any) => r.type.startsWith(coinStoreType));
  let balance = 0;
  coinResources.forEach((resource: any) => {
    if (resource?.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>") {
      //@ts-ignore
      balance = resource?.data?.coin?.value;
    }
  });
  return balance;
};

// export const getEvmNativeBalance = async (address: any, chainId: any) => {
//   let res = await axios.post(evm_balance_url, {
//     address: address,
//     chainId: chainId
//   });

//   let tokenData = res.data;
//   let nativeTokenBalance = 0;
//   if (tokenData) {
//     nativeTokenBalance = tokenData.nativeBalance.balance;
//   }
//   return nativeTokenBalance;
// };
export const getEvmNativeBalance = async (address: any, chainId: any) => {
  let res = await axios.post(evm_balance_url, {
    address: address,
    chainId: chainId
  }, {
    headers: {
      'apikey': 'IaXtxTgompESxFXBKSlHsEfnJTtdyV'
    }
  });

  let tokenData = res.data.data;
  let nativeTokenBalance = 0;
  if (tokenData) {
    nativeTokenBalance = await tokenData.find(
      (item: any) =>
        String(item.contract_address).toLocaleLowerCase() ===  "0x0000000000000000000000000000000000000000" || "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" || "0x0000000000000000000000000000000000001010"
    ).balance;
  }
  return nativeTokenBalance;
};

export const validataSolanaTokenAddress = async (
  ownerKey: PublicKey,
  connection: Connection,
  mint: PublicKey
) => {
  try {
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mint,
      new PublicKey(ownerKey),
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const tokenAccountInfo = await connection.getAccountInfo(associatedTokenAccount);
    if (tokenAccountInfo != null) {
      return { status: true };
    } else {
      const instruction = createAssociatedTokenAccountInstruction(
        ownerKey,
        associatedTokenAccount,
        ownerKey,
        mint
      );
      return { status: false, instruction: instruction };
    }
  } catch (error) {
    console.log(error);
    return { status: false };
  }
};

export const SolTokenMaxCalc = (maxTokens: number) => {
  const newAmount = maxTokens * 1000000000;
  if (newAmount > 10000000) {
    const afterDetecting = newAmount - 10000000;
    const addingLamports = afterDetecting / 1000000000;
    return addingLamports;
  } else {
    toast.error("Need minimum SOL balance of 0.01 SOL");
    return;
  }
};

export const AptTokenMaxCalc = (maxTokens: number) => {
  const newAmount = maxTokens * 100000000;
  if (newAmount > 5000000) {
    const afterDetecting = newAmount - 5000000;
    const addingLamports = afterDetecting / 100000000;
    return addingLamports;
  } else {
    toast.error("Need minimum APT balance of 0.05 APT");
    return;
  }
};

export const MaticTokenMaxCalc = (maxTokens: number) => {
    const newAmount = maxTokens * 1000000000000000000;
    if (newAmount > 10000000000000000) {
      const afterDetecting = newAmount - 10000000000000000;
      const addingLamports = afterDetecting / 1000000000000000000;
      return addingLamports;
    } else {
      toast.error("Need minimum MATIC balance of 0.01 APT");
      return;
    }
};

export const BSCTokenMaxCalc = (maxTokens: number) => {
  const newAmount = maxTokens * 1000000000000000000;
  if (newAmount > 10000000000000000) {
    const afterDetecting = newAmount - 10000000000000000;
    const addingLamports = afterDetecting / 1000000000000000000;
    return addingLamports;
  } else {
    toast.error("Need minimum BSC balance of 0.01 APT");
    return;
  }
};

export const ETHTokenMaxCalc = (maxTokens: number) => {
  const newAmount = maxTokens * 1000000000000000000;
  if (newAmount > 10000000000000000) {
    const afterDetecting = newAmount - 10000000000000000;
    const addingLamports = afterDetecting / 1000000000000000000;
    return addingLamports;
  } else {
    toast.error("Need minimum ETH balance of 0.01 APT");
    return;
  }
};

export const isValidNumber = (value: number | string) => {
    if (typeof value === 'number') return true;

    if (typeof value !== 'string') {
        return false;
    }

    if (value.trim() === '') {
        return false;
    }

    return !isNaN(value as any);
};
