// Network Configuration
export const AVALANCHE_FUJI_CHAIN_ID = 43113;

// Token Addresses (Avalanche Fuji Testnet)
export const USDC_FUJI_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65" as `0x${string}`;

// API Configuration
export const API_BASE_URL = (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_API_BASE_URL) || "http://localhost:3000";

export const API_ENDPOINTS = {
  BASIC: `/api/basic`,
  PREMIUM: `/api/premium`,
  FEEDBACK: `/api/feedback`,
  EVALUATION_VIEW: `/api/evaluation-view`,
  NEW_AGENT: `/api/new-agent`,
} as const;

// Payment Amounts (USDC with 6 decimals)
export const PAYMENT_AMOUNTS = {
  BASIC: {
    amount: "10000", // $0.01 USDC
    bigInt: BigInt(10000),
  },
  PREMIUM: {
    amount: "150000", // $0.15 USDC
    bigInt: BigInt(150000),
  },
  FEEDBACK: {
    amount: "50000", // $0.05 USDC for feedback submission
    bigInt: BigInt(50000),
  },
  EVALUATION_VIEW: {
    amount: "100000", // $0.10 USDC for detailed evaluation access
    bigInt: BigInt(100000),
  },
  NEW_AGENT: {
    amount: "20000", // $0.02 USDC for agent registration (plus 0.005 AVAX gas fee)
    bigInt: BigInt(20000),
  },
} as const;
