import axios from 'axios';
import { Environment, getTokensByChainId } from 'kana-aggregator-sdk';

export const getTokensAcrossAllChain = async (chainId: number) => {
    var tokenList = await getTokensByChainId("IaXtxTgompESxFXBKSlHsEfnJTtdyV",chainId, Environment.PROD);
    return tokenList.data;
}

export const saveTransactionCount = async (received: any) => {
    let data = await axios.post('https://ag.kanalabs.io/leaderboard/createTransactionCount', received);
    return data?.data;
};