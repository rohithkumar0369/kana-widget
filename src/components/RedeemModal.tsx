import { trimToFloor } from "utils/Helper";
import CustomModal from "./CustomModal";
import TimeIcon from "../assets/icons/timeIcon.svg";
import { executeRedeemInstruction, getTargetChainFromVaa } from "utils/CrossChain";
import { toast } from "react-toastify";
import { CHAIN_ID_APTOS, CHAIN_ID_BSC, CHAIN_ID_ETH, CHAIN_ID_POLYGON, CHAIN_ID_SOLANA } from "@certusone/wormhole-sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAptosContext } from "contexts/AptosWalletContext";
import { useAccount, useProvider, useSigner } from "wagmi";
interface RedeemModalProps {
  redeemData: any;
  properties: any;
  redeemLoading: any;
  setRedeemModalVisibility: any;
  setRedeemLoading: any;
  redeemSignature: any;
  redeemChain: any;
}
const RedeemModal = (props: RedeemModalProps) => {
  const {
    redeemData,
    properties,
    redeemLoading,
    setRedeemModalVisibility,
    setRedeemLoading,
    redeemSignature,
    redeemChain,
  } = props;
  const { publicKey, signTransaction } = useWallet();
  const aptosWallet = useAptosContext();
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const provider = useProvider();

  const primaryColor = properties?.config.containerStyle?.primaryColor;
  const buttonColor = properties?.config.containerStyle?.buttonColor;
  let uiDollarPrice = redeemData.tokenUsd * redeemData.tokenAmount;

  const submitRedeem = async () => {
    try {
      setRedeemLoading(true);
      //to get targetChain info pass the kana source Chain Id where tokens are bridged
      const targetChainInfo = await getTargetChainFromVaa(redeemSignature, redeemChain, provider);
      switch (targetChainInfo.targetChain) {
        //here chain ID refers to wormhole
        case CHAIN_ID_SOLANA: {
          // const checkAlreadyRedeemed = getIsTransferCompletedSolana(solanaWormhole.tokenBridge, targetChainInfo.vaa, getSolanaRpcConnection())
          const signature = await executeRedeemInstruction(
            targetChainInfo.vaa,
            targetChainInfo.targetChain,
            publicKey?.toBase58(),
            signTransaction
          );
          setRedeemLoading(false);
          setRedeemModalVisibility(false);
          toast.success(
            <div>
              Swap transaction success{" "}
              {
                <a href={`https://solscan.io/tx/${signature}`} target="_blank" rel="noreferrer">
                  {`https://solscan.io/tx/${signature}`}
                </a>
              }
            </div>
          );
          break;
        }
        case CHAIN_ID_APTOS: {
          //@ts-ignore
          // const checkAlreadyRedeemed = getIsTransferCompletedAptos(getAptosRpcEndPoint(), aptosWormhole.tokenBridge, targetChainInfo.vaaBytes)
          const signature = await executeRedeemInstruction(
            targetChainInfo.vaa,
            targetChainInfo.targetChain,
            aptosWallet?.account?.address?.toString(),
            aptosWallet.signAndSubmitTransaction
          );
          setRedeemLoading(false);
          setRedeemModalVisibility(false);
          toast.success(
            <div>
              Swap transaction success{" "}
              {
                <a
                  href={`https://explorer.aptoslabs.com/txn/${signature}?network=mainnet`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {`https://explorer.aptoslabs.com/txn/${signature}?network=mainnet`}
                </a>
              }
            </div>
          );
          break;
        }
        case CHAIN_ID_POLYGON: {
          // const checkAlreadyRedeemed = getIsTransferCompletedEth(polygonWormhole.tokenBridge, provider, targetChainInfo.vaa )
          let targetSignTransaction = signer;
          const signature = await executeRedeemInstruction(
            targetChainInfo.vaa,
            targetChainInfo.targetChain,
            address,
            targetSignTransaction
          );
          setRedeemLoading(false);
          setRedeemModalVisibility(false);
          toast.success(
            <div>
              Swap transaction success{" "}
              {
                <a
                  href={`https://polygonscan.com/tx/${signature}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {`https://polygonscan.com/tx/${signature}`}
                </a>
              }
            </div>
          );
          break;
        }
        case CHAIN_ID_BSC: {
          // const checkAlreadyRedeemed = getIsTransferCompletedEth(polygonWormhole.tokenBridge, provider, targetChainInfo.vaa )
          let targetSignTransaction = signer;
          const signature = await executeRedeemInstruction(
            targetChainInfo.vaa,
            targetChainInfo.targetChain,
            address,
            targetSignTransaction
          );
          setRedeemLoading(false);
          setRedeemModalVisibility(false);
          toast.success(
            <div>
              Swap transaction success{" "}
              {
                <a
                  href={`https://bscscan.com/tx/${signature}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {`https://bscscan.com/tx/${signature}`}
                </a>
              }
            </div>
          );
          break;
        }
        case CHAIN_ID_ETH: {
          // const checkAlreadyRedeemed = getIsTransferCompletedEth(polygonWormhole.tokenBridge, provider, targetChainInfo.vaa )
          let targetSignTransaction = signer;
          const signature = await executeRedeemInstruction(
            targetChainInfo.vaa,
            targetChainInfo.targetChain,
            address,
            targetSignTransaction
          );
          setRedeemLoading(false);
          setRedeemModalVisibility(false);
          toast.success(
            <div>
              Swap transaction success{" "}
              {
                <a
                  href={`https://etherscan.io/tx/${signature}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {`https://etherscan.io/tx/${signature}`}
                </a>
              }
            </div>
          );
          break;
        }
      }
    } catch (error: any) {
      setRedeemLoading(false);
      if (error.toString() === "WalletSignTransactionError: User rejected the request.") {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(error?.message ? error?.message : error.toString());
      }
    }
  };
  
  return (
    <CustomModal>
      <div className="p-4 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
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
            </div>
            <div className="ml-3 font-inter">
              <div className="font-bold">{redeemData.tokenAmount}</div>
              <div className="flex text-xs text-greyText">
                <div className="mr-2">{`$ ${trimToFloor(uiDollarPrice, 4)}`}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <img src={TimeIcon} alt="" />
            <div className="font-inter text-xs opacity-80 ml-2">22m</div>
          </div>
        </div>
        <div
          className="bg-widgetPrimary mt-6 px-3 py-4 rounded-xl flex items-center"
          style={{ backgroundColor: primaryColor }}
        >
          <div>
            <div className="relative mt-1 rounded-full h-8 w-8 bg-white"></div>
          </div>
          <div className="ml-3">
            <div className="font-inter text-[15px]">
              Claiming on <span className="font-bold">{redeemData.chainName}</span>
            </div>
          </div>
        </div>
        {redeemLoading ? (
          <div className="mt-5 text-center text-greyText">Do not close this tab</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div
              className="bg-transparent rounded-3xl border-[0.05rem] border-[#00FFFF] text-center cursor-pointer py-2.5 font-medium font-inter tracking-wider"
              onClick={() => setRedeemModalVisibility(false)}
            >
              <div
                className={`${buttonColor ? "" : "bg-gradient"} bg-clip-text cursor-pointer`}
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
              onClick={() => submitRedeem()}
            >
              Claim
            </div>
          </div>
        )}
      </div>
    </CustomModal>
  );
};

export default RedeemModal;
