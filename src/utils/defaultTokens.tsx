import Aptos from '../assets/images/aptos.webp';

export const SOLANA_TOKEN_1 = {
    chainId: 101,
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    extensions: {
        coingeckoId: 'solana',
        serumV3Usdc: '9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT',
        serumV3Usdt: 'HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1',
        website: 'https://solana.com/',
    },
};

export const SOLANA_TOKEN_2 = {
    chainId: 101,
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI:
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    tags: ['stablecoin'],
    extensions: {
        coingeckoId: 'usd-coin',
        serumV3Usdt: '77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS',
        website: 'https://www.centre.io/',
    },
};

export const APTOS_TOKEN_1 = {
    address: '0x1::aptos_coin::AptosCoin',
    name: 'Aptos Coin',
    decimals: 8,
    coingecko_id: 'aptos',
    symbol: 'APT',
    logoURI: Aptos,
};

export const APTOS_TOKEN_2 = {
    address: "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T",
    name: "USD Coin (Wormhole)",
    decimals: 6,
    coingecko_id: 'usd-coin',
    symbol: "USDC",
    logoURI: "https://raw.githubusercontent.com/hippospace/aptos-coin-list/main/icons/USDC.svg",
};

export const POLYGON_TOKEN_1 = {
    chainId: 137,
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png',
    extensions: {
        coingeckoId: 'matic-network',
    },
};

export const POLYGON_TOKEN_2 = {
    chainId: 137,
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
    extensions: {
        coingeckoId: 'usd-coin',
    },
};

export const BINANCE_TOKEN_1 = {
    chainId: 56,
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    symbol: "BNB",
    name: "BNB",
    decimals: 18,
    logoURI: "https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c_1.png",
}

export const BINANCE_TOKEN_2 = {
    chainId: 56,
    address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 18,
    logoURI: "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
}

export const ETHEREUM_TOKEN_1 = {
    chainId: 1,
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
}

export const ETHEREUM_TOKEN_2 = {
    chainId: 1,
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
}