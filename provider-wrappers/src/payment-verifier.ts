import { ethers } from 'ethers';
import { config } from './config';

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)'
];

/**
 * PaymentVerifier checks USDC payments on Arc network
 */
export class PaymentVerifier {
  private provider: ethers.JsonRpcProvider;
  private usdcContract: ethers.Contract;
  private verifiedNonces: Set<string>;
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.arc.rpcUrl);
    this.usdcContract = new ethers.Contract(
      config.arc.usdcAddress,
      ERC20_ABI,
      this.provider
    );
    this.verifiedNonces = new Set();
  }
  
  /**
   * Verify payment transaction
   */
  async verifyPayment(
    txHash: string,
    expectedAmount: number,
    recipientAddress: string,
    paymentNonce: string
  ): Promise<{ verified: boolean; reason?: string }> {
    // Check for nonce reuse
    if (this.verifiedNonces.has(paymentNonce)) {
      return {
        verified: false,
        reason: 'Payment nonce has already been used (replay attack prevented)'
      };
    }
    
    // In sandbox mode, skip onchain verification.
    if (config.demoMode) {
      console.log(`[SANDBOX MODE] Simulating payment verification for tx: ${txHash}`);
      this.verifiedNonces.add(paymentNonce);
      return { verified: true };
    }
    
    try {
      // Fetch transaction receipt
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        if (config.allowUnverifiedPayments) {
          console.warn('[PAYMENT VERIFIER] Receipt not found, allowing payment in relaxed mode');
          this.verifiedNonces.add(paymentNonce);
          return { verified: true };
        }
        return {
          verified: false,
          reason: 'Transaction not found or not confirmed'
        };
      }
      
      // Parse Transfer events
      const decimals = await this.usdcContract.decimals();
      const expectedAmountWei = ethers.parseUnits(expectedAmount.toFixed(6), decimals);
      
      // Look for USDC Transfer event to recipient
      const transferEvents = receipt.logs
        .filter(log => log.address.toLowerCase() === config.arc.usdcAddress.toLowerCase())
        .map(log => {
          try {
            return this.usdcContract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data
            });
          } catch {
            return null;
          }
        })
        .filter(event => event !== null);
      
      const matchingTransfer = transferEvents.find(event => {
        if (!event) return false;
        const toAddress = event.args.to as string;
        const amount = event.args.value as bigint;
        
        return (
          toAddress.toLowerCase() === recipientAddress.toLowerCase() &&
          amount >= expectedAmountWei
        );
      });
      
      if (!matchingTransfer) {
        if (config.allowUnverifiedPayments) {
          console.warn('[PAYMENT VERIFIER] No matching transfer, allowing payment in relaxed mode');
          this.verifiedNonces.add(paymentNonce);
          return { verified: true };
        }
        return {
          verified: false,
          reason: 'No matching USDC transfer found to recipient address'
        };
      }
      
      // Mark nonce as used
      this.verifiedNonces.add(paymentNonce);
      
      return { verified: true };
      
    } catch (error) {
      console.error('Payment verification error:', error);
      if (config.allowUnverifiedPayments) {
        console.warn('[PAYMENT VERIFIER] Verification error, allowing payment in relaxed mode');
        this.verifiedNonces.add(paymentNonce);
        return { verified: true };
      }
      return {
        verified: false,
        reason: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
