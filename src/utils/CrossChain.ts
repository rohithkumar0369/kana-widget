import {
  CHAIN_ID_APTOS,
  CHAIN_ID_BSC,
  CHAIN_ID_ETH,
  CHAIN_ID_POLYGON,
  CHAIN_ID_SOLANA,
  getEmitterAddressEth,
  getSignedVAAWithRetry,
  parseSequenceFromLogEth,
  parseTokenTransferVaa,
  postVaaSolanaWithRetry,
} from "@certusone/wormhole-sdk";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { AptosClient } from "aptos";
import {
  AptosTxType,
  Environment,
  getBridgeinstruction,
  getClaimSwappedInstruction,
  getVaaForWormholeAptos,
  getVaaForWormholeEvm,
  getVaaForWormholeSolana,
  kanaChainIdList,
  ParseBridgeInstructionResponse,
  ParseClaimSwapedInstructionResponse,
  ParseCrossChainQuote,
  ParseRedeemInstructionResponse,
  redeemInstruction,
  SolanaTxType,
  solanaWormhole,
} from "kana-aggregator-sdk";
import { getSolanaRpcConnection, sleep, validataSolanaTokenAddress } from "./Helper";
import {
  executeClaimInstructionForEVM,
  redeemOnEVM,
  submitAptosEntryFunctionPayload,
  submitSolanaLegacyTransaction,
  submitSolanaversionedTransaction,
  submitSwapXTransactionEvm,
} from "./Sign";

interface ProgressType {
  status: string | null;
  hash: string | null;
  completionPercentage: number;
}

export const sourceSwap = async(
  apiKey: any,
  crossRoute: any,
  sourceAddress: string,
  targetAddress: string,
  isAllowed: any,
  setSourceChainSwap: React.Dispatch<React.SetStateAction<ProgressType>>,
  sourceChainSwap: any,
  connection: Connection,
  sourceSignTransaction: any
) => {
  try {
    console.log(crossRoute,"crossRoute")
      const bridgeInstruction = await getBridgeinstruction(
          apiKey,
          crossRoute,
          sourceAddress,
          targetAddress,
          AptosTxType.EntryFunction, //BCS is not supported in aptos wallet adapter
          isAllowed,
          Environment.DEV
      )
      setSourceChainSwap({
          ...sourceChainSwap,
          completionPercentage: 50,
      });
      const bridgeExecutionChainId = bridgeInstruction.data.chainID;
      let transactionData: any = {};
      let transactionHash: any;
      //This approach is used only when versioned transaction is not supported
      switch (bridgeExecutionChainId) {
        case kanaChainIdList.solana: {
          transactionHash = await executeBridgeInstructionForSolana(
            bridgeInstruction,
            connection,
            sourceSignTransaction,
            setSourceChainSwap,
            sourceChainSwap
          );
          transactionData["transactionHash"] = transactionHash
          break;
        }
        case kanaChainIdList.aptos: {
          transactionHash = await executeBridgeInstructionForAptos(
            bridgeInstruction,
            sourceSignTransaction,
            setSourceChainSwap,
            sourceChainSwap
          );
          transactionData["transactionHash"] = transactionHash
          break;
        }
        case kanaChainIdList.polygon: {
          transactionData = await submitSwapXTransactionEvm(
            bridgeInstruction.data,
            sourceSignTransaction,
            setSourceChainSwap,
            sourceChainSwap,
            crossRoute.sourceChainID,
            crossRoute.sourceRoute?.withSlippage
          );
          break;
        }
        case kanaChainIdList.binance: {
          transactionData = await submitSwapXTransactionEvm(
            bridgeInstruction.data,
            sourceSignTransaction,
            setSourceChainSwap,
            sourceChainSwap,
            crossRoute.sourceChainID,
            crossRoute.sourceRoute?.withSlippage
          );
          break;
        }
        case kanaChainIdList.ethereum: {
          transactionData = await submitSwapXTransactionEvm(
            bridgeInstruction.data,
            sourceSignTransaction,
            setSourceChainSwap,
            sourceChainSwap,
            crossRoute.sourceChainID,
            crossRoute.sourceRoute?.withSlippage
          );
          break;
        }
        default: {
          break;
        }
      }
      console.log(transactionData,"transactionData")
      setSourceChainSwap({
        completionPercentage: 100,
        hash: transactionData.transactionHash,
        status: "success",
      });
      return transactionData;
  } catch(error: any) {
    throw new Error(error.message ? error.message : "Unknown error in source swap");
  }
}

export const crossChainBridging = async(
  crossRoute: ParseCrossChainQuote, 
  bridgeInstructionHash: any,
  bridgeReceipt: any,
  ethersProvider: any,
  setSwapBridging: any,
  swapBridging: any
) => {
  try {
    const data = await getVaaBytes(
      crossRoute.sourceChainID,
      bridgeInstructionHash,
      ethersProvider,
      bridgeReceipt,
      setSwapBridging,
      swapBridging
    );
    const vaaBytes = data.vaa;
    setSwapBridging({
      status: "success",
      completionPercentage: 100,
    });
    return vaaBytes;
  } catch (error: any) {
    throw new Error(error.message ? error.message : "Unknown error in crossChainBridging");
  }
}

export const crossChainTargetClaim = async(
  crossRoute: any,
  targetAddress: any,
  connection: any,
  targetSignTransaction: any,
  vaaBytes: any,
  apiKey: any,
  isAllowed: any,
  targetWallet: any,
  setTargetChainSwap: any,
  targetChainSwap: any,
  evmProvider: any
) => {
  console.log("Inside crossChainTargetClaim")
  if (crossRoute.targetChainID === kanaChainIdList.solana) {
    const solanaUsdc = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    const ataAccount = await validataSolanaTokenAddress(
      new PublicKey(targetAddress),
      getSolanaRpcConnection(),
      solanaUsdc
    );
    if (ataAccount.status === false) {
      const transactionInstruction = ataAccount.instruction;
      if (transactionInstruction !== undefined) {
        const _block = await connection.getLatestBlockhash("confirmed");
        const transaction = new Transaction({
          recentBlockhash: _block.blockhash,
          feePayer: new PublicKey(targetAddress),
        }).add(transactionInstruction);
        const signedTransaction = await targetSignTransaction(transaction);
        await getSolanaRpcConnection().sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });
      }
    }
    sleep(3000);
    await postVaaSolanaWithRetry(
      getSolanaRpcConnection(), // Solana Mainnet Connection
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      targetSignTransaction,
      //Solana Wallet Signer
      solanaWormhole.coreBridge,
      targetAddress,
      Buffer.from(vaaBytes),
      10,
      "confirmed"
    );
  }

  //After successfull bridge instruction execution execute claim instruction
  const claimInstruction = await getClaimSwappedInstruction(
    apiKey,
    crossRoute,
    targetAddress,
    vaaBytes,
    AptosTxType.EntryFunction,
    isAllowed,
    Environment.DEV
  );
  console.log("🚀 ~ file: CrossChain.ts:220 ~ claimInstruction:", claimInstruction)
  setTargetChainSwap({
    ...targetChainSwap,
    completionPercentage: 40,
  });
  const claimExecutionChainId = claimInstruction.data.chainID;
  let claimInstructionHash: any;
  switch (claimExecutionChainId) {
    case kanaChainIdList.solana: {
      claimInstructionHash = await executeClaimInstructionForSolana(
        claimInstruction,
        connection,
        targetSignTransaction
      );
      break;
    }
    case kanaChainIdList.aptos: {
      await targetWallet
        .connect()
        .then(async () => {
          claimInstructionHash = await executeClaimInstructionForAptos(
            claimInstruction,
            targetSignTransaction
          );
        })
        .catch(() => {
          throw new Error("Error in Wallet Reconnect on aptos wallet");
        });
      break;
    }
    case kanaChainIdList.polygon: {
      claimInstructionHash = await executeClaimInstructionForEVM(
        claimInstruction,
        targetSignTransaction,
        vaaBytes,
        kanaChainIdList.polygon,
        evmProvider
      );
      // let recipient = await redeemOnEth()
      break;
    }
    case kanaChainIdList.binance: {
      claimInstructionHash = await executeClaimInstructionForEVM(
        claimInstruction,
        targetSignTransaction,
        vaaBytes,
        kanaChainIdList.binance,
        evmProvider
      );
      // let recipient = await redeemOnEth()
      break;
    }
    case kanaChainIdList.ethereum: {
      claimInstructionHash = await executeClaimInstructionForEVM(
        claimInstruction,
        targetSignTransaction,
        vaaBytes,
        kanaChainIdList.ethereum,
        evmProvider
      );
      // let recipient = await redeemOnEth()
      break;
    }
    default: {
      console.log("Errorrrr")
      throw new Error("Chain is not supported currently");
    }
  }
  setTargetChainSwap({
    status: "success",
    hash: claimInstructionHash,
    completionPercentage: 100,
  });
  return claimInstructionHash;
}

// export const crossChainExecution = async (
//   apiKey: any,
//   crossRoute: ParseCrossChainQuote,
//   sourceAddress: string,
//   targetAddress: string,
//   sourceSignTransaction: any,
//   targetSignTransaction: any,
//   connection: Connection,
//   ethersProvider: any,
//   isAllowed: any,
//   targetWallet: WalletContextState,
//   setSourceChainSwap: any,
//   sourceChainSwap: any,
//   setSwapBridging: any,
//   swapBridging: any,
//   setTargetChainSwap: any,
//   targetChainSwap: any,
//   network: any
// ) => {
//   //getting bridge instruction for the selected cross chain routes
//   try {
//     const bridgeInstruction = await getBridgeinstruction(
//       apiKey,
//       crossRoute,
//       sourceAddress,
//       targetAddress,
//       AptosTxType.EntryFunction, //BCS is not supported in aptos wallet adapter
//       isAllowed,
//       Environment.DEV
//     );
//     setSourceChainSwap({
//       ...setSourceChainSwap,
//       completionPercentage: 50,
//     });
//     const bridgeExecutionChainId = bridgeInstruction.data.chainID;
//     let bridgeInstructionHash: any;
//     //This approach is used only when versioned transaction is not supported
//     switch (bridgeExecutionChainId) {
//       case kanaChainIdList.solana: {
//         bridgeInstructionHash = await executeBridgeInstructionForSolana(
//           bridgeInstruction,
//           connection,
//           sourceSignTransaction,
//           setSourceChainSwap,
//           sourceChainSwap
//         );
//         break;
//       }
//       case kanaChainIdList.aptos: {
//         bridgeInstructionHash = await executeBridgeInstructionForAptos(
//           bridgeInstruction,
//           sourceSignTransaction,
//           setSourceChainSwap,
//           sourceChainSwap
//         );
//         break;
//       }
//       case kanaChainIdList.polygon: {
//         bridgeInstructionHash = await submitSwapXTransactionEvm(
//           bridgeInstruction.data,
//           sourceSignTransaction,
//           setSourceChainSwap,
//           sourceChainSwap,
//           crossRoute.sourceChainID
//         );
//         break;
//       }
//       case kanaChainIdList.binance: {
//         bridgeInstructionHash = await submitSwapXTransactionEvm(
//           bridgeInstruction.data,
//           sourceSignTransaction,
//           setSourceChainSwap,
//           sourceChainSwap,
//           crossRoute.sourceChainID
//         );
//         break;
//       }
//       case kanaChainIdList.ethereum: {
//         bridgeInstructionHash = await submitSwapXTransactionEvm(
//           bridgeInstruction.data,
//           sourceSignTransaction,
//           setSourceChainSwap,
//           sourceChainSwap,
//           crossRoute.sourceChainID
//         );
//         break;
//       }
//       default: {
//         break;
//       }
//     }
//     setSourceChainSwap({
//       completionPercentage: 100,
//       hash: bridgeInstructionHash,
//       status: "success",
//     });
//     setSwapBridging({
//       ...swapBridging,
//       completionPercentage: 50,
//     });
//     const data = await getVaaBytes(
//       crossRoute.sourceChainID,
//       bridgeInstructionHash,
//       ethersProvider,
//       setSwapBridging,
//       swapBridging
//     );
//     const vaaBytes = data.vaa;
//     setSwapBridging({
//       status: "success",
//       completionPercentage: 100,
//     });
//     switch (crossRoute.targetChainID) {
//       case kanaChainIdList.ethereum:{
//         await (network.switchNetworkAsync && network.switchNetworkAsync(1));
//         break;
//       }
//       case kanaChainIdList.binance:{
//         await (network.switchNetworkAsync && network.switchNetworkAsync(56));
//         break;
//       }
//       case kanaChainIdList.polygon:{
//         await (network.switchNetworkAsync && network.switchNetworkAsync(137));
//         break;
//       }
//       default:
//         break;
//     }
//     //before executing claim instruction get VAA bytes from wormhole
//     //VAA has to be posted if target chain is solana
//     if (crossRoute.targetChainID === kanaChainIdList.solana) {
//       const solanaUsdc = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
//       const ataAccount = await validataSolanaTokenAddress(
//         new PublicKey(targetAddress),
//         getSolanaRpcConnection(),
//         solanaUsdc
//       );
//       if (ataAccount.status === false) {
//         const transactionInstruction = ataAccount.instruction;
//         if (transactionInstruction !== undefined) {
//           const _block = await connection.getLatestBlockhash("confirmed");
//           const transaction = new Transaction({
//             recentBlockhash: _block.blockhash,
//             feePayer: new PublicKey(targetAddress),
//           }).add(transactionInstruction);
//           const signedTransaction = await targetSignTransaction(transaction);
//           await getSolanaRpcConnection().sendRawTransaction(signedTransaction.serialize(), {
//             skipPreflight: false,
//             preflightCommitment: "confirmed",
//           });
//         }
//       }
//       sleep(3000);
//       await postVaaSolanaWithRetry(
//         getSolanaRpcConnection(), // Solana Mainnet Connection
//         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//         //@ts-ignore
//         targetSignTransaction,
//         //Solana Wallet Signer
//         solanaWormhole.coreBridge,
//         targetAddress,
//         Buffer.from(vaaBytes),
//         10,
//         "confirmed"
//       );
//     }

//     //After successfull bridge instruction execution execute claim instruction
//     const claimInstruction = await getClaimSwappedInstruction(
//       apiKey,
//       crossRoute,
//       targetAddress,
//       vaaBytes,
//       AptosTxType.EntryFunction,
//       isAllowed,
//       Environment.DEV
//     );
//     setTargetChainSwap({
//       ...targetChainSwap,
//       completionPercentage: 40,
//     });
//     const claimExecutionChainId = claimInstruction.data.chainID;
//     let claimInstructionHash: any;
//     switch (claimExecutionChainId) {
//       case kanaChainIdList.solana: {
//         claimInstructionHash = await executeClaimInstructionForSolana(
//           claimInstruction,
//           connection,
//           targetSignTransaction
//         );
//         break;
//       }
//       case kanaChainIdList.aptos: {
//         await targetWallet
//           .connect()
//           .then(async () => {
//             claimInstructionHash = await executeClaimInstructionForAptos(
//               claimInstruction,
//               targetSignTransaction
//             );
//           })
//           .catch(() => {
//             throw new Error("Error in Wallet Reconnect on aptos wallet");
//           });
//         break;
//       }
//       case kanaChainIdList.polygon: {
//         claimInstructionHash = await executeClaimInstructionForEVM(
//           claimInstruction,
//           targetSignTransaction,
//           vaaBytes,
//           kanaChainIdList.polygon
//         );
//         // let recipient = await redeemOnEth()
//         break;
//       }
//       case kanaChainIdList.binance: {
//         claimInstructionHash = await executeClaimInstructionForEVM(
//           claimInstruction,
//           targetSignTransaction,
//           vaaBytes,
//           kanaChainIdList.binance
//         );
//         // let recipient = await redeemOnEth()
//         break;
//       }
//       case kanaChainIdList.binance: {
//         claimInstructionHash = await executeClaimInstructionForEVM(
//           claimInstruction,
//           targetSignTransaction,
//           vaaBytes,
//           kanaChainIdList.ethereum
//         );
//         // let recipient = await redeemOnEth()
//         break;
//       }
//       default: {
//         throw new Error("Chain is not supported currently");
//       }
//     }
//     setTargetChainSwap({
//       status: "success",
//       hash: claimInstructionHash,
//       completionPercentage: 100,
//     });
//     return claimInstructionHash;
//   } catch (error: any) {
//     setTargetChainSwap({
//       status: "failed",
//       hash: null,
//     });
//     throw new Error(error.message ? error.message : "Unknown error in crossChain swap");
//   }
// };

//Executes bridge instruction for solana
export const executeBridgeInstructionForSolana = async (
  bridgeInstruction: ParseBridgeInstructionResponse,
  connection: Connection,
  solanaSignTransaction: any,
  setSourceChainSwap: any,
  sourceChainSwap: any
) => {
  try {
    let bridgeInstructionHash: any;
    for (let i = 0; i < bridgeInstruction.data.transferInstruction.length; i++) {
      const receivedBridgeInstructions = bridgeInstruction.data.transferInstruction[i];
      if (receivedBridgeInstructions.type === SolanaTxType.Legacy) {
        //execute legacy transaction
        const signature = await submitSolanaLegacyTransaction(
          receivedBridgeInstructions.transaction,
          connection,
          solanaSignTransaction
        );
        bridgeInstructionHash = signature;
      }
      if (receivedBridgeInstructions.type === SolanaTxType.versioned) {
        //execute Versioned transactions
        const signature = await submitSolanaversionedTransaction(
          receivedBridgeInstructions.transaction,
          connection,
          solanaSignTransaction
        );
        bridgeInstructionHash = signature;
      }
    }
    return bridgeInstructionHash;
  } catch (error: any) {
    setSourceChainSwap({
      ...sourceChainSwap,
      hash: null,
      status: "failed",
    });
    console.log("Error occurred in executeBridgeInstructionForSolana::" + error);
    throw new Error(
      error.message ? error.message : "Unknown error in executing bridge instruction for solana"
    );
  }
};

export const executeBridgeInstructionForAptos = async (
  bridgeInstruction: ParseBridgeInstructionResponse,
  aptosSigntransaction: any,
  setSourceChainSwap: any,
  sourceChainSwap: any
) => {
  try {
    for (let i = 0; i < bridgeInstruction.data.transferInstruction.length; i++) {
      const receivedBridgeInstructions = bridgeInstruction.data.transferInstruction[i];
      if (receivedBridgeInstructions.type === AptosTxType.BcsSerialized) {
        //currently Bcs serialized does not work with APTOS WALLET ADAPTER
        throw new Error("BCS transaction is not supported");
      }
      if (receivedBridgeInstructions.type === AptosTxType.EntryFunction) {
        const hash = await submitAptosEntryFunctionPayload(
          receivedBridgeInstructions.transaction,
          aptosSigntransaction,
          "60000"
        );
        return hash;
      }
    }
  } catch (error: any) {
    setSourceChainSwap({
      ...sourceChainSwap,
      hash: null,
      status: "failed",
    });
    console.log("Error occurred in executeBridgeInstructionForAptos::" + error);
    throw new Error(
      error.message ? error.message : "Unknown error in executing bridge instruction for aptos"
    );
  }
};

export const executeClaimInstructionForSolana = async (
  claimInstruction: ParseClaimSwapedInstructionResponse | ParseRedeemInstructionResponse,
  connection: Connection,
  solanaSignTransaction: any
) => {
  for (let i = 0; i < claimInstruction.data.claimInstruction.length; i++) {
    const receivedClaimInstructions = claimInstruction.data.claimInstruction[i];
    if (receivedClaimInstructions.type === SolanaTxType.Legacy) {
      //execute legacy transaction
      const signature = await submitSolanaLegacyTransaction(
        receivedClaimInstructions.transaction,
        connection,
        solanaSignTransaction
      );
      return signature;
    }
    if (receivedClaimInstructions.type === SolanaTxType.versioned) {
      //execute Versioned transactions
      const signature = await submitSolanaversionedTransaction(
        receivedClaimInstructions.transaction,
        connection,
        solanaSignTransaction
      );
      return signature;
    }
  }
};

export const executeClaimInstructionForAptos = async (
  claimInstruction: ParseClaimSwapedInstructionResponse | ParseRedeemInstructionResponse,
  aptosSigntransaction: any
) => {
  for (let i = 0; i < claimInstruction.data.claimInstruction.length; i++) {
    const receivedClaimInstructions = claimInstruction.data.claimInstruction[i];
    if (receivedClaimInstructions.type === AptosTxType.BcsSerialized) {
      //currently Bcs serialized does not work with APTOS WALLET ADAPTER
      throw new Error("BCS transaction is not supported");
    }
    if (receivedClaimInstructions.type === AptosTxType.EntryFunction) {
      //execute Versioned transactions
      const hash = await submitAptosEntryFunctionPayload(
        receivedClaimInstructions.transaction,
        aptosSigntransaction,
        "80000"
      );
      return hash;
    }
  }
};

const getAptos = () => {
  const MAINNET_NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
  return new AptosClient(MAINNET_NODE_URL);
};



export const getVaaBytes = async (
  sourceChainId: any,
  bridgeInstructionHash: string,
  evmProvider: any,
  bridgeReceipt?: any,
  setSwapBridging?: any,
  swapBridging?: any
) => {
  try {
    let vaa;
    let targetChain;
    let targetData;
    // console.log(bridgeInstructionHash,"bridgeInstructionHash")
    // console.log(evmProvider,"ethersProviderethersProvider")
    switch (sourceChainId) {
      case kanaChainIdList.solana: {
        vaa = await getVaaForWormholeSolana(bridgeInstructionHash, getSolanaRpcConnection());
        const data = parseTokenTransferVaa(vaa);
        targetData = data;
        targetChain = data.toChain;
        // const checkAlreadyRedeemed = await getIsTransferCompletedSolana(solanaWormhole.tokenBridge, vaa, getSolanaRpcConnection())
        break;
      }
      case kanaChainIdList.aptos: {
        vaa = await getVaaForWormholeAptos(bridgeInstructionHash, getAptos());
        const data = parseTokenTransferVaa(vaa);
        targetData = data;
        targetChain = data.toChain;
        break;
      }
      case kanaChainIdList.polygon: {
        vaa = await getVaaForWormholeEvm(bridgeReceipt, evmProvider, kanaChainIdList.polygon);
        const data = parseTokenTransferVaa(vaa);
        targetData = data;
        targetChain = data.toChain;
        break;
      }
      case kanaChainIdList.binance: {
        console.log(bridgeReceipt,evmProvider,"bridgeReceipt",);
        
        vaa = await getVaaForWormholeEvm(bridgeReceipt, evmProvider, kanaChainIdList.binance);
        console.log("inside binance", vaa)
        const data = parseTokenTransferVaa(vaa);
        console.log("🚀 ~ file: CrossChain.ts:429 ~ data:", data)
        targetData = data;
        targetChain = data.toChain;
        break;
      }
      case kanaChainIdList.ethereum: {
        
        vaa = await getVaaForWormholeEvm(bridgeReceipt, evmProvider, kanaChainIdList.ethereum);
        // const sequence = parseSequenceFromLogEth(bridgeRecipt, "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B")
        // console.log('sequence', sequence)
        // const { vaaBytes } = await getSignedVAAWithRetry(
        //   ['https://wormhole-v2-mainnet-api.certus.one'],
        //   2,
        //   getEmitterAddressEth("0x3ee18B2214AFF97000D974cf647E7C347E8fa585"),
        //   sequence,
        //   10000,
        //   1
        // )
        const data = parseTokenTransferVaa(vaa);
        console.log("🚀 ~ file: CrossChain.ts:429 ~ data:", data)
        targetData = data;
        targetChain = data.toChain;
        break;
      }
      default: {
        console.log("inside getVaaBytes");
        throw new Error("Chain is not supported currently");
      }
    }

    return {
      vaa,
      targetData,
      targetChain,
    };
  } catch (error: any) {
    if (swapBridging) {
      setSwapBridging({
        ...swapBridging,
        status: "failed",
      });
    }
    console.log("Error occurred in getVaaBytes::" + error);
    throw new Error(error.message ? error.message : error.toString());
  }
};

export const getTargetChainFromVaa = async (signatureHash: any, chainId: any, evmProvider: any) => {
  console.log("inside getTargetChainFromVaa", chainId);
  const receipt = await evmProvider.waitForTransaction(signatureHash);
  const data = await getVaaBytes(chainId, signatureHash, evmProvider, receipt);
  return data;
};

export const executeRedeemInstruction = async (
  vaa: Uint8Array,
  targetChainId: any,
  targetAddress: any,
  signTransaction: any
) => {
  switch (targetChainId) {
    case CHAIN_ID_SOLANA: {
      await postVaaSolanaWithRetry(
        getSolanaRpcConnection(), // Solana Mainnet Connection
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        signTransaction,
        //Solana Wallet Signer
        solanaWormhole.coreBridge,
        targetAddress,
        Buffer.from(vaa),
        5
      );
      const redeemInstructions = await redeemInstruction(
        "IaXtxTgompESxFXBKSlHsEfnJTtdyV",
        kanaChainIdList.solana,
        targetAddress,
        vaa,
        undefined,
        Environment.DEV
      );
      const claimSignature = await executeClaimInstructionForSolana(
        redeemInstructions,
        getSolanaRpcConnection(),
        signTransaction
      );
      return claimSignature;
    }
    case CHAIN_ID_APTOS: {
      const redeemInstructions = await redeemInstruction(
        "IaXtxTgompESxFXBKSlHsEfnJTtdyV",
        kanaChainIdList.aptos,
        targetAddress,
        vaa,
        AptosTxType.EntryFunction,
        Environment.DEV
      );
      const claimSignature = await executeClaimInstructionForAptos(
        redeemInstructions,
        signTransaction
      );
      return claimSignature;
    }
    case CHAIN_ID_POLYGON: {
      const claimSignature = await redeemOnEVM(signTransaction, vaa, kanaChainIdList.polygon);
      return claimSignature;
      // const redeemInstructions = await redeemInstruction(
      //     'IaXtxTgompESxFXBKSlHsEfnJTtdyV',
      //     vaa,
      //     kanaChainIdList.polygon,
      //     targetAddress,
      //     undefined,
      //     Environment.PROD
      // );

      // console.log("redeem ins",redeemInstructions)
    }
    case CHAIN_ID_BSC: {
      const claimSignature = await redeemOnEVM(signTransaction, vaa, kanaChainIdList.binance);
      return claimSignature;
      // const redeemInstructions = await redeemInstruction(
      //     'IaXtxTgompESxFXBKSlHsEfnJTtdyV',
      //     vaa,
      //     kanaChainIdList.polygon,
      //     targetAddress,
      //     undefined,
      //     Environment.PROD
      // );

      // console.log("redeem ins",redeemInstructions)
    }
    case CHAIN_ID_ETH: {
      const claimSignature = await redeemOnEVM(signTransaction, vaa, kanaChainIdList.ethereum);
      return claimSignature;
      // const redeemInstructions = await redeemInstruction(
      //     'IaXtxTgompESxFXBKSlHsEfnJTtdyV',
      //     vaa,
      //     kanaChainIdList.polygon,
      //     targetAddress,
      //     undefined,
      //     Environment.PROD
      // );

      // console.log("redeem ins",redeemInstructions)
    }
  }
};
