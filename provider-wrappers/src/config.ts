import dotenv from 'dotenv';
dotenv.config();

export const config = {
  gemini: {
    port: parseInt(process.env.GEMINI_PORT || '4001'),
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  },
  claude: {
    port: parseInt(process.env.CLAUDE_PORT || '4002'),
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307'
  },
  openai: {
    port: parseInt(process.env.OPENAI_PORT || '4003'),
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  },
  arc: {
    rpcUrl: process.env.ARC_RPC_URL || 'https://rpc.arc.xyz',
    usdcAddress: process.env.ARC_USDC_ADDRESS || '0x1234567890123456789012345678901234567890'
  },
  demoMode: process.env.DEMO_MODE === 'true'
};
