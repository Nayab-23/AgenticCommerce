# 🚀 Quick Start Guide

## 5-Minute Demo Setup

### Step 1: Install Dependencies

```bash
# From project root
npm install

# Install workspace dependencies
cd shared && npm install && npm run build && cd ..
cd router-backend && npm install && cd ..
cd provider-wrappers && npm install && cd ..
cd web && npm install && cd ..
```

### Step 2: Start Services

Open **3 separate terminals**:

**Terminal 1 - Router Backend:**
```bash
cd router-backend
npm run dev
```
Wait for: `🚀 Router Backend running on http://localhost:3000`

**Terminal 2 - Provider Wrappers:**
```bash
cd provider-wrappers
npm run dev
```
Wait for: 
- `🟢 GEMINI Provider running on http://localhost:4001`
- `🔵 CLAUDE Provider running on http://localhost:4002`

**Terminal 3 - Frontend:**
```bash
cd web
npm run dev
```
Wait for: `Local: http://localhost:5173/`

### Step 3: Open the UI

Open your browser to: **http://localhost:5173**

### Step 4: Try Example Prompts

**Example 1: Simple Math (Cheap Provider)**
```
Prompt: What is 2 + 2?
Max Cost: $0.02
Quality: Balanced
```
Expected: Routes to Gemini (cheap), ~$0.0001

**Example 2: Code Request (Balanced)**
```
Prompt: Write a function to reverse a string in JavaScript
Max Cost: $0.02
Quality: Balanced
```
Expected: Routes to Claude or Gemini depending on optimization

**Example 3: Complex Reasoning (Premium)**
```
Prompt: Explain quantum entanglement and its implications for computing
Max Cost: $0.02
Quality: Premium
```
Expected: Routes to Claude (premium), higher cost

### Step 5: View Results

The UI will show:
- ✅ Classification (task type, tokens, quality)
- ✅ Provider quotes received
- ✅ Selected provider + rationale
- ✅ Payment details with TX hash
- ✅ Completion result
- ✅ Verification outcome
- ✅ Usage statistics

---

## Understanding the Output

### Payment Details
```
Amount: $0.000125 USDC
Recipient: 0x742d...bEb5
TX Hash: 0xabc123... (clickable - opens Arc explorer)
Block: #12345
```

In **DEMO_MODE** (default), the TX hash is simulated. Set `DEMO_MODE=false` for real blockchain transactions.

### Provider Quotes
```
gemini - cheap tier
- gemini-1.5-flash
- $0.00001/1K tokens
- ~800ms latency

claude - premium tier
- claude-3-haiku-20240307
- $0.00025/1K tokens
- ~1200ms latency
```

### Decision Rationale
```
"Selected gemini (gemini-1.5-flash): 
Quality tier cheap matches cheap preference. 
Estimated cost $0.0001 USDC, latency ~800ms."
```

---

## Troubleshooting

**"Cannot connect to router"**
- Ensure router-backend is running on port 3000
- Check for errors in router-backend terminal

**"No providers available"**
- Ensure provider-wrappers are running
- Check ports 4001 and 4002 are not in use

**"Payment verification failed"**
- Ensure `DEMO_MODE=true` in both .env files
- Restart provider-wrappers

**Port conflicts**
- Change ports in .env files if 3000, 4001, 4002, or 5173 are in use

---

## Next Steps

### Enable Real Blockchain Transactions

1. Get Arc testnet access and USDC
2. Set `DEMO_MODE=false` in all .env files
3. Update `ARC_RPC_URL` and `ARC_USDC_ADDRESS`
4. Fund treasury wallet (see `scripts/fund-treasury.sh`)

### Add Real LLM APIs

1. Get API keys:
   - Gemini: https://ai.google.dev/
   - Anthropic: https://www.anthropic.com/api

2. Add to `provider-wrappers/.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ANTHROPIC_API_KEY=your_key_here
   ```

3. Providers will use real APIs instead of mocks

### Explore the Code

- **Classification logic**: `router-backend/src/classifier.ts`
- **Provider selection**: `router-backend/src/selector.ts`
- **Payment handling**: `router-backend/src/payment.ts`
- **Verification**: `router-backend/src/verifier.ts`

---

## Demo Tips for Judges

1. **Show the flow**: Submit → Classify → Quote → Select → Pay → Complete → Verify
2. **Highlight TX hash**: Click to "view on explorer" (placeholder in demo mode)
3. **Demonstrate optimization**: Show cost difference between providers
4. **Show escalation**: Use a prompt that might fail verification
5. **Show guardrails**: Try exceeding daily cap or per-request limit
6. **Show stats**: Refresh stats panel to see totals

---

**Ready to demo! 🎉**
