import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Arc Network
  arcRpcUrl: process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network',
  arcUsdcAddress: process.env.ARC_USDC_ADDRESS || '0x1234567890123456789012345678901234567890',
  arcChainId: parseInt(process.env.ARC_CHAIN_ID || '1234'),
  arcExplorerBase: process.env.ARC_EXPLORER_BASE || 'https://testnet.arcscan.app',

  // Circle Programmable Wallet
  circleApiKey: process.env.CIRCLE_API_KEY || '',
  circleEntitySecretRaw: process.env.CIRCLE_ENTITY_SECRET_RAW || '',
  circleWalletId: process.env.CIRCLE_WALLET_ID || '',
  circleTokenId: process.env.CIRCLE_TOKEN_ID || '15dc2b5d-0994-58b0-bf8c-3a0501148ee8', // Arc testnet USDC
  agentWalletAddress: process.env.AGENT_WALLET_ADDRESS || '',

  // Legacy Treasury (for backwards compatibility)
  treasuryPrivateKey: process.env.TREASURY_PRIVATE_KEY || '',
  
  // Provider Configuration
  providers: {
    gemini: {
      address: process.env.PROVIDER_GEMINI_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5',
      url: process.env.PROVIDER_GEMINI_URL || 'http://localhost:4001'
    },
    claude: {
      address: process.env.PROVIDER_CLAUDE_ADDRESS || '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      url: process.env.PROVIDER_CLAUDE_URL || 'http://localhost:4002'
    },
    openai: {
      address: process.env.PROVIDER_OPENAI_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      url: process.env.PROVIDER_OPENAI_URL || 'http://localhost:4003'
    }
  },
  
  // Spending Limits
  dailySpendCapUsdc: parseFloat(process.env.DAILY_SPEND_CAP_USDC || '1.0'),
  perRequestCapUsdc: parseFloat(process.env.PER_REQUEST_CAP_USDC || '0.02'),
  
  // System
  port: parseInt(process.env.PORT || '3000'),
  demoMode: process.env.DEMO_MODE === 'true',
  emergencyStop: process.env.EMERGENCY_STOP === 'true',
  
  // Allowlist
  providerAllowlist: process.env.PROVIDER_ALLOWLIST?.split(',') || []
};
