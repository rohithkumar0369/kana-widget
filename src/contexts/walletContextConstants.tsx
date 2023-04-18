import { kanaChainIdList } from 'kana-aggregator-sdk';
import Solana from '../assets/images/solana.svg';
import Aptos from '../assets/images/aptos.webp';
import Polygon from '../assets/images/polygon.svg';

export interface ChainInfo {
    id: number;
    name: string;
    logo: string;
}

export const SOLANA_HOST = 'https://api.devnet.solana.com';
export type Cluster = 'devnet' | 'testnet';
const urlParams = new URLSearchParams(window.location.search);
const paramCluster = urlParams.get('cluster');
export const CLUSTER: Cluster = paramCluster === 'devnet' ? 'devnet' : 'testnet';

export const CHAINS: ChainInfo[] = [
    {
        id: kanaChainIdList.solana,
        name: 'Solana',
        logo: Solana,
    },
    {
        id: kanaChainIdList.aptos,
        name: 'Aptos',
        logo: Aptos,
    },
    {
        id: kanaChainIdList.polygon,
        name: 'Polygon',
        logo: Polygon,
    },
];
