import { config } from './config';
import { PaymentDetails } from '@agentic-router/shared';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PaymentService handles USDC transfers via Circle Programmable Wallets on Arc
 */
export class PaymentService {
  private publicKeyPem: string | null = null;

  constructor() {
    // Load Circle's public key for entity secret encryption
    if (!config.demoMode) {
      try {
        const pemPath = path.join(process.cwd(), '..', 'circle_entity_public.pem');
        this.publicKeyPem = fs.readFileSync(pemPath, 'utf-8');
      } catch (error) {
        console.warn('Could not load circle_entity_public.pem, will fetch from API');
      }
    }
  }

  /**
   * Generate fresh entitySecretCiphertext for Circle API calls
   * Must be generated fresh for each API request (anti-replay)
   */
  private async generateEntitySecretCiphertext(): Promise<string> {
    // Fetch public key if not loaded
    if (!this.publicKeyPem) {
      const response = await fetch('https://api.circle.com/v1/w3s/config/entity/publicKey', {
        headers: {
          'Authorization': `Bearer ${config.circleApiKey}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      this.publicKeyPem = data.data.publicKey;
    }

    // Convert hex entity secret to raw bytes
    const entitySecretBytes = Buffer.from(config.circleEntitySecretRaw, 'hex');

    // Encrypt with RSA-OAEP SHA-256
    const encrypted = crypto.publicEncrypt(
      {
        key: this.publicKeyPem!,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      entitySecretBytes
    );

    return encrypted.toString('base64');
  }

  /**
   * Send USDC payment to provider via Circle Programmable Wallet
   */
  async payProvider(
    recipientAddress: string,
    amountUsdc: number
  ): Promise<PaymentDetails> {
    if (config.emergencyStop) {
      throw new Error('Emergency stop is enabled - payments are disabled');
    }

    const paymentNonce = uuidv4();

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

    // Validate Circle config
    if (!config.circleApiKey || !config.circleEntitySecretRaw || !config.circleWalletId) {
      throw new Error('Circle configuration missing. Set CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET_RAW, and CIRCLE_WALLET_ID');
    }

    console.log(`Sending ${amountUsdc} USDC to ${recipientAddress} via Circle...`);

    try {
      // Generate fresh ciphertext for this request
      const entitySecretCiphertext = await this.generateEntitySecretCiphertext();

      // Initiate transfer via Circle API
      const transferResponse = await fetch('https://api.circle.com/v1/w3s/developer/transactions/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.circleApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idempotencyKey: paymentNonce,
          walletId: config.circleWalletId,
          destinationAddress: recipientAddress,
          amounts: [amountUsdc.toString()],
          tokenId: config.circleTokenId,
          feeLevel: 'MEDIUM',
          entitySecretCiphertext
        })
      });

      const transferData = await transferResponse.json();

      if (transferData.code || transferData.error) {
        throw new Error(`Circle transfer failed: ${transferData.message || JSON.stringify(transferData.errors)}`);
      }

      const transactionId = transferData.data.id;
      console.log(`Transfer initiated: ${transactionId}`);

      // Poll for transaction completion
      const txDetails = await this.waitForTransaction(transactionId);

      console.log(`Transaction confirmed: ${txDetails.txHash} in block ${txDetails.blockHeight}`);

      return {
        amount_usdc: amountUsdc,
        recipient_address: recipientAddress,
        tx_hash: txDetails.txHash,
        block_number: txDetails.blockHeight,
        payment_nonce: paymentNonce
      };
    } catch (error) {
      console.error('Payment failed:', error);
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Poll Circle API until transaction is complete
   */
  private async waitForTransaction(transactionId: string, maxAttempts = 30): Promise<{ txHash: string; blockHeight: number }> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`https://api.circle.com/v1/w3s/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${config.circleApiKey}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      const tx = data.data?.transaction;

      if (tx?.state === 'COMPLETE') {
        return {
          txHash: tx.txHash,
          blockHeight: tx.blockHeight
        };
      }

      if (tx?.state === 'FAILED') {
        throw new Error(`Transaction failed: ${tx.errorReason || 'Unknown reason'}`);
      }

      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Transaction timed out waiting for confirmation');
  }

  /**
   * Get treasury balance from Circle
   */
  async getTreasuryBalance(): Promise<number> {
    if (config.demoMode || !config.circleWalletId) {
      return 0;
    }

    try {
      const response = await fetch(`https://api.circle.com/v1/w3s/wallets/${config.circleWalletId}/balances`, {
        headers: {
          'Authorization': `Bearer ${config.circleApiKey}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      const usdcBalance = data.data?.tokenBalances?.find(
        (b: any) => b.token.id === config.circleTokenId
      );

      return usdcBalance ? parseFloat(usdcBalance.amount) : 0;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  /**
   * Get treasury address
   */
  getTreasuryAddress(): string {
    return config.agentWalletAddress || '0x0000000000000000000000000000000000000000';
  }
}
