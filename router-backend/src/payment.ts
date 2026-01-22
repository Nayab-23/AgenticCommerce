import { ethers } from 'ethers';
import { config } from './config';
import { PaymentDetails } from '@agentic-router/shared';
import { v4 as uuidv4 } from 'uuid';

// ERC20 ABI for USDC transfers
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

/**
 * PaymentService handles USDC transfers on Arc network
 */
export class PaymentService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private usdcContract: ethers.Contract;
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.arcRpcUrl);
    this.wallet = new ethers.Wallet(config.treasuryPrivateKey, this.provider);
    this.usdcContract = new ethers.Contract(
      config.arcUsdcAddress,
      ERC20_ABI,
      this.wallet
    );
  }
  
  /**
   * Send USDC payment to provider
   */
  async payProvider(
    recipientAddress: string,
    amountUsdc: number
  ): Promise<PaymentDetails> {
    if (config.emergencyStop) {
      throw new Error('Emergency stop is enabled - payments are disabled');
    }
    
    // Generate unique nonce
    const paymentNonce = uuidv4();
    
    // Convert USDC to smallest unit (6 decimals)
    const decimals = await this.usdcContract.decimals();
    const amount = ethers.parseUnits(amountUsdc.toFixed(6), decimals);
    
    console.log(`Sending ${amountUsdc} USDC to ${recipientAddress}...`);
    
    try {
      // In demo mode, simulate the transaction
      if (config.demoMode) {
        const mockTxHash = '0x' + Array(64).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        console.log(`[DEMO MODE] Simulated payment tx: ${mockTxHash}`);
        
        return {
          amount_usdc: amountUsdc,
          recipient_address: recipientAddress,
          tx_hash: mockTxHash,
          block_number: Math.floor(Math.random() * 1000000),
          payment_nonce: paymentNonce
        };
      }
      
      // Real transaction
      const tx = await this.usdcContract.transfer(recipientAddress, amount);
      console.log(`Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      return {
        amount_usdc: amountUsdc,
        recipient_address: recipientAddress,
        tx_hash: tx.hash,
        block_number: receipt.blockNumber,
        payment_nonce: paymentNonce
      };
    } catch (error) {
      console.error('Payment failed:', error);
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get treasury balance
   */
  async getTreasuryBalance(): Promise<number> {
    const balance = await this.usdcContract.balanceOf(this.wallet.address);
    const decimals = await this.usdcContract.decimals();
    return parseFloat(ethers.formatUnits(balance, decimals));
  }
  
  /**
   * Get treasury address
   */
  getTreasuryAddress(): string {
    return this.wallet.address;
  }
}
