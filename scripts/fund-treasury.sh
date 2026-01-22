#!/bin/bash

# Fund treasury wallet script
# This is a placeholder - in production you'd interact with a faucet or transfer from your wallet

echo "💰 Treasury Funding Instructions"
echo ""
echo "To fund the treasury wallet for demo/testing:"
echo ""
echo "1. Get your treasury address from the router backend logs or .env file"
echo "   Default test address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo ""
echo "2. If using Arc testnet:"
echo "   - Visit Arc testnet faucet: https://faucet.arc.xyz"
echo "   - Request testnet USDC for your treasury address"
echo ""
echo "3. If using Arc mainnet (NOT RECOMMENDED FOR TESTING):"
echo "   - Transfer USDC from your wallet to the treasury address"
echo "   - Ensure you have enough USDC for testing (recommended: 5-10 USDC)"
echo ""
echo "4. Verify balance:"
echo "   curl http://localhost:3000/api/treasury"
echo ""
echo "⚠️  WARNING: The default private key in .env.example is from Hardhat's"
echo "   test accounts and should NEVER be used with real funds!"
echo ""
