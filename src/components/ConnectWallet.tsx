import SearchIcon from "../assets/icons/searchIcon.svg";
import { useWallet, Wallet } from "@solana/wallet-adapter-react";
import { WalletName, WalletReadyState } from "@solana/wallet-adapter-base";
import { useAptosContext } from "contexts/AptosWalletContext";
import { kanaChainIdList } from "kana-aggregator-sdk";
import Coinbase from "../assets/icons/coinbase.svg";
import MetaMask from "../assets/icons/metamask.svg";
import { AiOutlineMail } from "react-icons/ai";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Connector,
  useAccount,
  useConnect,
  useDisconnect,
  useProvider,
} from "wagmi";
// import Web3 from 'web3';
// import SignIn from './SignIn';
// import { Web3AuthCore } from '@web3auth/core';
import iconGoogle from "../assets/icons/icon-google.png";
import iconApple from "../assets/icons/icon-apple.png";
import iconFacebook from "../assets/icons/icon-facebook.png";
import iconDiscord from "../assets/icons/icon-discord.png";
import iconTwitch from "../assets/icons/icon-twitch.png";
import { BsGithub, BsTwitter } from "react-icons/bs";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { useTranslation } from "react-i18next";
import { useSmartWalletProvider } from "../contexts/SmartWalletContext";

interface ConnectWalletInterface {
  chain: any;
  walletSearchText: any;
  onWalletSearchTextChange(e: any): any;
  primaryColor: string;
  secondaryColor: string;
}

const ConnectWallet = (props: ConnectWalletInterface) => {
  const { t } = useTranslation();
  const { wallets, select, disconnect: solanaDisconnect } = useWallet();
  const {
    wallets: aptosWallets,
    connect: aptosWalletConnect,
    disconnect: aptosDisconnect,
  } = useAptosContext();
  const { connect: PolygonConnect, connectors } = useConnect();
  const { disconnect: EVMDisconnect } = useDisconnect();
  const { connector: PolygonConnector } = useAccount();
  const {
    web3Auth,
    provider,
    connect,
    disconnect,
    isSigningIn,
    showEmailLogin,
    setShowEmailModal,
    isSocialLogin
  } = useSmartWalletProvider();
  const [email, setEmail] = useState<string | null>(null);
  // const [showEmailLogin, setShowEmailLogin] = useState<boolean>(false);

  const [detected, undetected] = useMemo(() => {
    const detected: any = [];
    const undetected: any = [];
    const walletArr =
      props.chain === kanaChainIdList.solana ? wallets : aptosWallets;
    for (const wallet of walletArr) {
      if (
        wallet.readyState === WalletReadyState.Installed ||
        wallet.readyState === WalletReadyState.Loadable
      ) {
        detected.push(wallet);
      } else if (wallet.readyState === WalletReadyState.NotDetected) {
        undetected.push(wallet);
      }
    }
    return [detected, undetected];
  }, [wallets, aptosWallets]);

  const visibleSignInOptions = useMemo(() => {
    const signInOptions = [
      {
        title: "Google",
        icon: <img src={iconGoogle} alt="google" />,
        onClick: () => connect("google"),
      },
      {
        title: "Apple",
        icon: <img src={iconApple} alt="apple" />,
        onClick: () => connect("apple"),
      },
      {
        title: "Facebook",
        icon: <img src={iconFacebook} alt="facebook" />,
        onClick: () => connect("facebook"),
      },
      {
        title: "Discord",
        icon: <img src={iconDiscord} alt="discord" />,
        onClick: () => connect("discord"),
      },
      {
        title: "Twitter",
        icon: <BsTwitter size={24} color="#00ACEE" />,
        onClick: () => connect("twitter"),
      },
      {
        title: "Email",
        icon: <AiOutlineMail size={24} color="#fff" />,
        onClick: () => setShowEmailModal(true),
      },
      {
        title: "GitHub",
        icon: <BsGithub size={24} color="#000" />,
        onClick: () => connect("github"),
      },
      {
        title: "Twitch",
        icon: <img src={iconTwitch} alt="twitch" />,
        onClick: () => connect("twitch"),
      },
    ];
    return signInOptions;
  }, [connect, setShowEmailModal]);

  const walletSelection = (item: any) => {
    props.chain === kanaChainIdList.solana
      ? select(item.adapter.name)
      : props.chain === kanaChainIdList.aptos &&
        aptosWalletConnect(item.adapter.name);
  };

  const disconnectWallet = () => {
    switch (props.chain) {
      case kanaChainIdList.solana:
        solanaDisconnect();
        break;
      case kanaChainIdList.aptos:
        aptosDisconnect();
        break;
      case kanaChainIdList.polygon:
        EVMDisconnect();
        break;
      case kanaChainIdList.binance:
        EVMDisconnect();
        break;
      case kanaChainIdList.ethereum:
        EVMDisconnect();
        break;
      default:
        break;
    }
  };

  if (
    props.chain === kanaChainIdList.polygon ||
    props.chain === kanaChainIdList.binance
  ) {
    if (showEmailLogin) {
      return (
        <div>
          <div
            className="bg-[rgba(255,255,255,0.05)] rounded-3xl mt-7 px-6 py-2 max-h-[22rem] overflow-scroll"
            style={{ background: props.secondaryColor }}
          >
            <div className="font-inter font-bold leading-5 ml-1">
              <div className="text-lg ">Sign in with Email</div>
            </div>
          </div>
          <div className="font-inter flex items-center bg-widgetPrimary px-1 py-1 mt-2 rounded-lg border-[1px] border-[#413F47]">
            <input
              type="text"
              autoFocus={true}
              placeholder="Enter you email"
              // value={}
              onChange={(e) => setEmail(e?.target?.value ?? "")}
              // onChange={props.onWalletSearchTextChange}
              className="outline-0 w-full border-0 bg-transparent font-inter p-2"
            />
          </div>
          <button
            className="rounded-3xl py-3 font-medium text-black font-inter mt-[10px] px-1 py-1 tracking-wider w-full bg-gradient"
            // style={secondaryColor ? { background: secondaryColor } : {}}
            id="connect_wallet_btn"
            onClick={() => connect("email_passwordless", email ?? undefined)}
          >
            submit
          </button>
        </div>
      );
    }
    return (
      <div>
        <div className="font-inter flex items-center bg-widgetPrimary px-3 py-1 mt-5 rounded-lg border-[1px] border-[#413F47]">
          <img src={SearchIcon} className="mr-1" alt="" />
          <input
            type="text"
            autoFocus={true}
            placeholder="Search"
            value={props.walletSearchText}
            onChange={props.onWalletSearchTextChange}
            className="outline-0 w-full border-0 bg-transparent font-inter p-2"
          />
        </div>
        <Tabs>
          <TabList className="flex items-center justify-center bg-[rgba(255,255,255,0.02)] w-fit m-auto rounded-3xl mt-8">
            <Tab className="social_login">{t("web3")}</Tab>
            <Tab className="social_login">{t("kana")}</Tab>
          </TabList>
          <TabPanel>
            <div
              className="bg-[rgba(255,255,255,0.05)] rounded-3xl mt-7 px-6 py-2 max-h-[22rem] overflow-scroll"
              style={{ background: props.secondaryColor }}
            >
              {connectors.map((connector, index) => {
                return (
                  <div
                    className={`flex items-center py-4 px-4 my-1 rounded-2xl cursor-pointer ${
                      props.primaryColor
                        ? `hover:bg-${props.primaryColor}`
                        : "hover:bg-widgetPrimary"
                    }`} //${selected.tokenName === token.symbol && 'bg-widgetPrimary'}
                    onClick={() => PolygonConnect({ connector })}
                    key={index}
                  >
                    {connector.id === "metaMask" ? (
                      <img className="w-11" src={MetaMask} alt="token" />
                    ) : (
                      <img className="w-11" src={Coinbase} alt="token" />
                    )}
                    <div className="font-inter font-bold leading-5 ml-3">
                      <div className="text-lg ">{connector.name}</div>
                    </div>
                    {PolygonConnector?.id === connector.id && (
                      <div
                        className="flex-1 text-right text-greyText"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          EVMDisconnect();
                        }}
                      >
                        Disconnect
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabPanel>
          <TabPanel>
            <div
              className="bg-[rgba(255,255,255,0.05)] rounded-3xl mt-7 px-6 py-2 max-h-[22rem] overflow-scroll"
              style={{ background: props.secondaryColor }}
            >
              {web3Auth?.status === "connected" && (
                <div
                  className="flex-1 text-right text-greyText cursor-pointer"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    disconnect();
                  }}
                >
                  Disconnect
                </div>
              )}
              {visibleSignInOptions.map((signInOption) => (
                <div
                  key={signInOption.title}
                  onClick={isSigningIn ? undefined : signInOption.onClick}
                  className="flex flex-row items-center font-bold text-[1.3rem] py-4 px-4 my-1 rounded-2xl cursor-pointer hover:bg-widgetPrimary "
                >
                  {/* <img src={signInOption.icon} alt="google" className="mr-6" /> {t('google')} */}
                  {signInOption.icon}
                  <div className="font-inter font-bold leading-5 ml-3">
                    <div className="text-lg ">{signInOption.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabPanel>
        </Tabs>
      </div>
    );
  } else {
    return (
      <div>
        {/* <div className='flex items-center bg-widgetPrimary px-3 py-1 mt-5 rounded-lg border-[1px] border-[#413F47]'>
                    <img src={SearchIcon} className='mr-1' alt="" />
                    <input type="text" autoFocus={true} placeholder='Search' value={props.walletSearchText} onChange={props.onWalletSearchTextChange} className='outline-0 w-full border-0 bg-transparent font-inter p-2' />
                </div> */}
        <div
          className="bg-widgetSecondary rounded-3xl mt-7 px-3 py-1 max-h-[22rem] overflow-scroll"
          style={{ background: props.secondaryColor }}
        >
          {
            // props.chain === kanaChainIdList.polygon ||
            // props.chain === kanaChainIdList.binance ||
            props.chain === kanaChainIdList.ethereum ? (
              connectors.length > 0 ? (
                connectors.map((connector, index) => {
                  return (
                    <div
                      className={`flex items-center py-2 px-2 my-1 rounded-2xl cursor-pointer ${
                        props.primaryColor
                          ? `hover:bg-${props.primaryColor}`
                          : "hover:bg-widgetPrimary"
                      }`} //${selected.tokenName === token.symbol && 'bg-widgetPrimary'}
                      onClick={() => PolygonConnect({ connector })}
                      key={index}
                    >
                      {connector.id === "metaMask" ? (
                        <img className="w-11" src={MetaMask} alt="token" />
                      ) : (
                        <img className="w-11" src={Coinbase} alt="token" />
                      )}
                      <div className="font-inter font-bold leading-5 ml-3">
                        <div className="text-lg ">{connector.name}</div>
                      </div>
                      {PolygonConnector?.id === connector.id && (
                        <div
                          className="flex-1 text-right text-greyText"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            disconnectWallet();
                          }}
                        >
                          Disconnect
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center">No Wallet's Found</div>
              )
            ) : detected.length > 0 ? (
              detected?.map((item: any, index: any) => (
                <div
                  className={`flex items-center py-2 px-2 my-1 rounded-2xl cursor-pointer hover:bg-widgetPrimary `} //${selected.tokenName === token.symbol && 'bg-widgetPrimary'}
                  onClick={() => walletSelection(item)}
                  key={index}
                >
                  <img className="w-11" src={item.adapter.icon} alt="token" />
                  <div className="font-inter font-bold leading-5 ml-3">
                    <div className="text-lg ">{item.adapter.name}</div>
                  </div>
                  {item.adapter?.connected && (
                    <div
                      className="flex-1 text-right text-greyText"
                      onClick={() => disconnectWallet()}
                    >
                      Disconnect
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center">No Wallet's Found</div>
            )
          }
        </div>
      </div>
    );
  }
};
export default ConnectWallet;
