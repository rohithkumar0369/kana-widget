import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import axios from "axios";
import { sleep } from "./Helper";
import { ethers, Signer, utils } from "ethers";
import { kanaChainIdList, polygonWormhole } from "kana-aggregator-sdk";
import { approveEth, createNonce, tryNativeToUint8Array } from "@certusone/wormhole-sdk";
import { ethers_contracts } from "@certusone/wormhole-sdk";
import bs58 from "bs58";
import { EntryFunctionPayload } from "aptos/src/generated";
import { TokenImplementation__factory } from "@certusone/wormhole-sdk/lib/cjs/ethers-contracts";

export const submitSolanaversionedTransaction = async (
  encodeTransaction: any,
  connection: Connection, //has to be removed from params,
  signTransaction: any
) => {
  try {
    const transactionBuffer = Buffer.from(encodeTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(transactionBuffer);
    const block_ = await connection.getLatestBlockhash("confirmed");
    transaction.message.recentBlockhash = block_.blockhash;
    //transaction has to be signed
    const signedtransaction = await signTransaction(transaction);
    const blockhashResponse = await connection.getLatestBlockhashAndContext("confirmed");
    const lastValidBlockHeight = blockhashResponse.context.slot + 180;
    let blockheight = (await connection.getBlockHeight("confirmed")) + 50;
    let transactionId: any;
    const _block = await connection.getLatestBlockhash("confirmed");
    let count = 0;
    while (blockheight < lastValidBlockHeight) {
      transactionId = await connection.sendRawTransaction(signedtransaction.serialize(), {
        skipPreflight: true,
      });
      await sleep(700);
      count = count + 1;
      if (count > 0 && count % 10 === 0) {
        //@ts-ignore
        const status = await connection.confirmTransaction(
          {
            signature: transactionId,
            blockhash: _block.blockhash,
            lastValidBlockHeight: _block.lastValidBlockHeight,
          },
          "confirmed"
        );
        if (status.value.err == null) {
          break;
        } else {
          throw new Error(status.value.err.toString() ? status.value.err.toString() : "");
        }
      }
      blockheight = await connection.getBlockHeight("confirmed");
    }
    return transactionId;
  } catch (error: any) {
    console.log("Error occurred in submitSolanaversionedTransaction::", JSON.stringify(error));
    throw new Error(
      error?.message ? error?.message : "Unknown error while submitting solana versioned transaction"
    );
  }
};

export const submitAptosEntryFunctionPayload = async (
  entryFunctionPayload: any,
  signTransaction: any,
  maxGas: any
) => {
  try {
    let data = await axios
      .get("https://aptos-mainnet.nodereal.io/v1/5a91ee76b3fc4f31b38aa3130d0ae3c8/v1")
      .then((response) => {
        return response.data;
      });
    //@ts-ignore

    const hash = await signTransaction(entryFunctionPayload as EntryFunctionPayload, {
      max_gas_amount: maxGas,
      gas_unit_price: "100",
      expiration_timestamp_secs: Math.ceil(data.ledger_timestamp / 1000000) + 240,
    });
    return hash?.hash;
  } catch (error: any) {
    throw new Error(error.message ? error.message : error.toString());
  }
};

// export const getPolygonGasPrice = async (signer: Signer) => {
//     let gp = (await signer.getGasPrice()).toNumber() + 10000;
//     // console.log({ gp });
//     let gp2 = ethers.BigNumber.from(gp);
//     console.log({ gp2 });

//     return gp;
// };

export const getPolygonGasPriceX = async () => {
  try {
    let res = await axios.get(
      "https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=ZXFHGY1CBP6VJ2W249PEN294YPF2W1GWBU"
    );
    return {
      error: false,
      data: res.data.result,
    };
  } catch (e) {
    return {
      error: true,
      //@ts-ignore
      data: e?.code,
    };
  }
};

export const getBinanceGasPriceX = async () => {
  try {
    let res = await axios.get('https://api.bscscan.com/api?module=gastracker&action=gasoracle&apikey=B3VKFTF25X2H98SQVTW6DQ8WNCAQ2SNGIT');
    return {
      error: false,
      data: res.data.result,
    };
  } catch (e) {
    return {
      error: true,
      //@ts-ignore
      data: e?.code,
    };
  }
};

export const getEthereumGasPriceX = async () => {
  try {
    let res = await axios.get('https://api.etherscan.com/api?module=gastracker&action=gasoracle&apikey=6W8QWDS6Q826SJP6PF9V4F4QV2QV9DY9XE');
    return {
      error: false,
      data: res.data.result,
    };
  } catch (e) {
    return {
      error: true,
      //@ts-ignore
      data: e?.code,
    };
  }
};

export const getEvmGasPrice = async (signer: Signer, chainId: number) => {
  // if(chainId === kanaChainIdList.polygon){
  //   let result = await getPolygonGasPriceX();
  //   if (result.error == false) {
  //     let gasPriceInGwei = result.data.FastGasPrice;
  //     let gasPriceInWei = utils.parseUnits(gasPriceInGwei, "gwei");
  //     return gasPriceInWei;
  //   }
  // }
  let gasPrice;
  let result;
  switch (chainId) {
    case kanaChainIdList.polygon:
      result = await getPolygonGasPriceX();
      if (result.error == false) {
        let gasPriceInGwei = result.data.FastGasPrice;
        let gasPrice = utils.parseUnits(gasPriceInGwei, "gwei");
        return gasPrice;
      } else {
        gasPrice = await signer.getGasPrice();
        return gasPrice;
      }
    case kanaChainIdList.binance:
      result = await getBinanceGasPriceX();
      if (result.error == false) {
        let gasPriceInGwei = result.data.FastGasPrice;
        let gasPrice = utils.parseUnits(gasPriceInGwei, "gwei");
        return gasPrice;
      } else {
        gasPrice = await signer.getGasPrice();
        return gasPrice;
      }
    case kanaChainIdList.ethereum:
      result = await getEthereumGasPriceX();
      if (result.error == false) {
        let gasPriceInGwei = result.data.FastGasPrice;
        let gasPrice = utils.parseUnits(gasPriceInGwei, "gwei");
        return gasPrice;
      } else {
        gasPrice = await signer.getGasPrice();
        return gasPrice;
      }
    default:
      break;
  }
};

export const submitSwapTransactionEvm = async (payload: any, signer: any, chainId: number) => {
  try {
    const swapPayload = payload.swapInstruction;
    const txns: any = [];
    for await (payload of swapPayload) {
      // let gp = await getEvmGasPrice(signer, chainId);

      // const swap = await signer.sendTransaction({
      //   from: payload.from,
      //   to: payload.to,
      //   data: payload.data,
      //   value: payload.value,
      //   gasPrice: gp,
      //   gasLimit: 1000000,
      // });
      // const swapRecipt = await swap.wait();
      // txns.push(swapRecipt);
      // let gp = await getEvmGasPrice(signer, chainId);
      // const swapEstimate = await signer.estimateGas({
      //     from: payload.from,
      //     to: payload.to,
      //     data: payload.data,
      //     value: payload.value,
      //     gasPrice: gp,
      // });
      let gp = await getEvmGasPrice(signer, chainId);

      const swap = await signer.sendTransaction({
          from: payload.from,
          to: payload.to,
          data: payload.data,
          value: payload.value,
          gasPrice: gp,
          gasLimit: 350000,
      });
      console.log('swap', swap.hash);
      const swapRecipt = await swap.wait();
      txns.push(swapRecipt);
    }
    return { error: false, data: txns };
  } catch (e: any) {
    console.log("Error occurred ::" + e);
    return { error: true, data: e };
  }
};

export const submitSwapXTransactionEvm = async (
  payload: any,
  signer: any,
  setSourceChainSwap: any,
  sourceChainSwap: any,
  chainId: number,
  minimumReceivedAmount: any
) => {
  try {
    const bridgePayload = payload.transferInstruction;
    console.log("🚀 ~ file: Sign.ts:167 ~ bridgePayload:", bridgePayload)
    let gp = await getEvmGasPrice(signer, chainId);
    const swapPayload = payload.swapInstruction?.data;
    console.log("🚀 ~ file: Sign.ts:170 ~ swapPayload:", swapPayload)
    const txns: any = [];
    let bridgeAmount;
    if (swapPayload) {
      console.log(swapPayload,"swapPayload")
      for await (payload of swapPayload) {
        // gp = await getEvmGasPrice(signer, chainId);
        // const swap = await signer.sendTransaction({
        //     from: payload.from,
        //     to: payload.to,
        //     data: payload.data,
        //     value: payload.value,
        //     gasPrice: gp,
        //     gasLimit: 1000000,
        // });
        // const swapRecipt = await swap.wait();
        // console.log("🚀 ~ file: Sign.ts:185 ~ forawait ~ swapRecipt:", swapRecipt)
        // txns.push(swapRecipt);
        // let gp = await getEvmGasPrice(signer, chainId);
        // const swapEstimate = await signer.estimateGas({
        //     from: payload.from,
        //     to: payload.to,
        //     data: payload.data,
        //     value: payload.value,
        //     gasPrice: gp,
        // });
        let gp = await getEvmGasPrice(signer, chainId);

        const swap = await signer.sendTransaction({
            from: payload.from,
            to: payload.to,
            data: payload.data,
            value: payload.value,
            gasPrice: gp,
            gasLimit: 350000,
        });
        console.log('swap', swap.hash);
        const swapRecipt = await swap.wait();
        txns.push(swapRecipt);
      }
      // switch (chainId) {
      //   case kanaChainIdList.polygon:
      //     bridgeAmount = parseInt(txns[txns.length - 1].logs[txns[txns.length - 1].logs.length - 2].data);
      //     break;
      //   case kanaChainIdList.binance:
      //     bridgeAmount = parseInt(txns[txns.length - 1].logs[txns[txns.length - 1].logs.length - 1].data);
      //     break;
      //   case kanaChainIdList.ethereum:
      //     bridgeAmount = parseInt(txns[txns.length - 1].logs[txns[txns.length - 1].logs.length - 1].data);
      //     break;
      // }
      bridgeAmount = minimumReceivedAmount;
    } else {
        bridgeAmount = bridgePayload.amount;
    }
    console.log(bridgePayload.amount,"bridgePayload.amount")
    console.log(bridgeAmount,"bridgeAmount")
    gp = await getEvmGasPrice(signer, chainId);
    // const token = TokenImplementation__factory.connect(
    //   bridgePayload.tokenAddress,
    //   signer
    // )
    // const approveTxnGas = await token.estimateGas.approve(
    //   bridgePayload.tokenBridge,
    //   ethers.utils.parseUnits(bridgeAmount.toString(), 'wei'),
    //   { gasPrice: }
    // )
    // const approveTxn = await token.approve(
    //   bridgePayload.tokenBridge,
    //   ethers.utils.parseUnits(bridgeAmount.toString(), 'wei'),
    //   { gasLimit: parseInt(approveTxnGas._hex), gasPrice }
    // )
    // const approveTxnRecipt = await approveTxn.wait()
    // const approveETH = await approveEth(
    //   bridgePayload.tokenBridge,
    //   bridgePayload.tokenAddress,
    //   signer,
    //   ethers.utils.parseUnits(bridgeAmount.toString(), "wei"),
    //   { gasLimit: 1000000, gasPrice: gp }
    // );
  
    const approveETH = await approveEth(
      bridgePayload.tokenBridge,
      bridgePayload.tokenAddress,
      signer,
      ethers.utils.parseUnits(bridgeAmount.toString(), "wei"),
      { gasLimit: 200000, gasPrice: gp }
    );
    
    const bridge = ethers_contracts.Bridge__factory.connect(bridgePayload.tokenBridge, signer);
    gp = await getEvmGasPrice(signer, chainId);
    // const transferTxnGas = await bridge.estimateGas.transferTokens(
    //   bridgePayload.tokenAddress,
    //   ethers.utils.parseUnits(bridgeAmount.toString(), "wei"),
    //   bridgePayload.recepientChainId,
    //   tryNativeToUint8Array(bridgePayload.recepient, bridgePayload.recepientChainId),
    //   0,
    //   createNonce(),
    //   { gasPrice: gp }
    // );
    gp = await getEvmGasPrice(signer, chainId);
    const transferTxn = await bridge.transferTokens(
      bridgePayload.tokenAddress,
      ethers.utils.parseUnits(bridgeAmount.toString(), "wei"),
      bridgePayload.recepientChainId,
      tryNativeToUint8Array(bridgePayload.recepient, bridgePayload.recepientChainId),
      0,
      createNonce(),
      { gasLimit: 400000, gasPrice: gp }
    );

    const transferReceipt = await transferTxn.wait();
    return {
      transferReceipt: transferReceipt, 
      transactionHash: transferReceipt.transactionHash
    };
  } catch (e: any) {
    console.log("Error", e);
    setSourceChainSwap({
      ...sourceChainSwap,
      hash: null,
      status: "failed",
    });
    if (e.code === "ACTION_REJECTED" || e.code === 4001) {
      throw new Error("Transaction rejected by user");
    } else {
      throw new Error(e.message ? e.message : e.toString());
    }
  }
};

export const executeClaimInstructionForEVM = async (
  payload: any,
  signer: Signer,
  vaaBytes: any,
  chainId: number,
  provider: any
) => {
  try {
    let chainName = '';
    switch (chainId) {
      case kanaChainIdList.ethereum:
        chainName = "Ethereum"
        break;
      case kanaChainIdList.binance:
        chainName = "Binance"
        break;
      case kanaChainIdList.polygon:
        chainName = "Polygon"
        break;
    }
    let swapTxns: any = [];
    let claimIX = payload.data?.claimInstruction;
    let swapIx = payload.data?.swapInstruction;
    const bridge = ethers_contracts.Bridge__factory.connect(claimIX.tokenBridge, signer);
    let gp = await getEvmGasPrice(signer, chainId);
    // const gas = await bridge.estimateGas.completeTransfer(vaaBytes, {
    //   gasPrice: gp,
    // });
    const v = await bridge.completeTransfer(vaaBytes, {
      gasLimit: 350000,
      gasPrice: gp,
    });
    const receipt = await v.wait();
    swapTxns.push(receipt.transactionHash);

    if (swapIx) {
      try {
        let swapPayloads = swapIx.data;
        for await (payload of swapPayloads) {
          // gp = await getEvmGasPrice(signer, chainId);
          // const swapEstimate = await signer.estimateGas({
          //   from: payload.from,
          //   to: payload.to,
          //   data: payload.data,
          //   value: payload.value,
          //   gasPrice: gp,
          // });
          gp = await getEvmGasPrice(signer, chainId);
          const swap = await signer.sendTransaction({
            from: payload.from,
            to: payload.to,
            data: payload.data,
            value: payload.value,
            gasPrice: gp,
            gasLimit: 350000,
          });
          const swapRecipt = await swap.wait();
          swapTxns.push(swapRecipt.transactionHash);
        }
      } catch (err) {
        console.log(err,"err in executeClaimInstructionForEVM")
        throw new Error(`Swap failed but token claim successful on ${chainName}`);
      }
      return swapTxns[swapTxns.length - 1];
    } else {
      return v.hash;
    }
  } catch (e: any) {
    console.log("Error", e);
    if (e.code === "ACTION_REJECTED" || e.code === 4001) {
      throw new Error("Transaction rejected by user");
    } else {
      throw new Error(e.message ? e.message : "Claim failed");
    }
  }
};

export const submitSolanaLegacyTransaction = async (
  encodedTransaction: any,
  connection: Connection, //has to be removed from params
  signTransaction: any
) => {
  try {
    const transaction = Transaction.from(Buffer.from(bs58.decode(encodedTransaction)));
    const data = await connection.getLatestBlockhash("finalized");
    transaction.lastValidBlockHeight = data.lastValidBlockHeight - 150;
    const signedtransaction = await signTransaction(transaction);
    //transaction has to be signed
    //sign transaction
    const blockhashResponse = await connection.getLatestBlockhashAndContext("confirmed");
    const lastValidBlockHeight = blockhashResponse.context.slot + 180;
    let blockheight = (await connection.getBlockHeight("confirmed")) + 50;
    let transactionId: any;
    const _block = await connection.getLatestBlockhash("confirmed");
    let count = 0;
    while (blockheight < lastValidBlockHeight) {
      transactionId = await connection.sendRawTransaction(signedtransaction.serialize(), {
        skipPreflight: true,
      });
      await sleep(700);
      count = count + 1;
      if (count > 0 && count % 10 === 0) {
        //@ts-ignore
        const status = await connection.confirmTransaction(
          {
            signature: transactionId,
            blockhash: _block.blockhash,
            lastValidBlockHeight: _block.lastValidBlockHeight,
          },
          "confirmed"
        );
        if (status.value.err == null) {
          break;
        } else {
          throw new Error(status.value.err.toString() ? status.value.err.toString() : "");
        }
      }
      blockheight = await connection.getBlockHeight("confirmed");
    }
    return transactionId;
  } catch (error: any) {
    throw new Error(
      error.message ? error.message : "Unknown error while submitting solana legacy transaction"
    );
  }
};

export const redeemOnEVM = async (signer: Signer, vaaBytes: any, chainId: number) => {
  try {
    let TOKEN_BRIDGE: any;
    switch (chainId) {
      case kanaChainIdList.polygon:
        TOKEN_BRIDGE = "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE";
        break;
      case kanaChainIdList.binance:
        TOKEN_BRIDGE = "0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7";
        break;
      case kanaChainIdList.ethereum:
        TOKEN_BRIDGE = "0x3ee18B2214AFF97000D974cf647E7C347E8fa585";
        break;
      default:
        break;
    }

    const bridge = ethers_contracts.Bridge__factory.connect(TOKEN_BRIDGE, signer);
    let gp = await getEvmGasPrice(signer, chainId);
    const gas = await bridge.estimateGas.completeTransfer(vaaBytes, {
      gasPrice: gp,
    });
    gp = await getEvmGasPrice(signer, chainId);
    const txn = await bridge.completeTransfer(vaaBytes, {
      gasLimit: parseInt(gas._hex) + 1000,
      gasPrice: gp,
    });
    const receipt = await txn.wait();
    return txn.hash;
  } catch (e: any) {
    console.log("Error", e);
    if (e.code === "ACTION_REJECTED" || e.code === 4001) {
      throw new Error("Transaction rejected by user");
    } else {
      throw new Error("Claim failed on polygon");
    }
  }
};
