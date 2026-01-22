# 🎯 Demo Checklist

Use this checklist to ensure a smooth demo presentation.

## Pre-Demo Setup ✅

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`./scripts/setup.sh`)
- [ ] `.env` files created in router-backend and provider-wrappers
- [ ] Ports 3000, 4001, 4002, 5173 are available

### Services Running
- [ ] Router backend running on port 3000
- [ ] Gemini provider running on port 4001
- [ ] Claude provider running on port 4002
- [ ] Frontend running on port 5173
- [ ] All services show "running" in terminal
- [ ] No error messages in any terminal

### Browser Ready
- [ ] Frontend loads at http://localhost:5173
- [ ] No console errors (F12 developer tools)
- [ ] Input form is visible and functional
- [ ] Stats panel shows zeros (clean slate)

---

## Demo Script 📝

### Opening (1 minute)

**Say:** "This is an autonomous LLM procurement agent that optimizes costs while maintaining quality. It routes prompts to the cheapest provider meeting your constraints and pays them per-request in USDC on Arc blockchain with verifiable onchain receipts."

**Show:** 
- [ ] Point out the UI elements
- [ ] Explain the input controls
- [ ] Highlight the results panel

### Demo 1: Simple Math (2 minutes)

**Say:** "Let's start with a simple math question."

**Do:**
- [ ] Enter prompt: "What is 2 + 2?"
- [ ] Set Max Cost: $0.02
- [ ] Set Quality: Balanced
- [ ] Keep allowlist enabled
- [ ] Click "Run Agent"

**Show:**
- [ ] Classification: trivial_math, ~15 tokens, cheap quality
- [ ] Quotes: 2 providers shown with prices
- [ ] Selection: Gemini chosen (cheaper)
- [ ] Payment: Amount, address, TX hash
- [ ] Completion: "The answer is 4."
- [ ] Verification: ✅ PASSED

**Highlight:** "Notice it selected Gemini at $0.0001 instead of Claude at $0.0003 - that's a 3x cost savings while still getting the right answer."

### Demo 2: Code Generation (2 minutes)

**Say:** "Now let's try something more complex - code generation."

**Do:**
- [ ] Enter prompt: "Write a JavaScript function to reverse a string"
- [ ] Set Max Cost: $0.02
- [ ] Set Quality: Balanced
- [ ] Click "Run Agent"

**Show:**
- [ ] Classification: code, ~50 tokens
- [ ] Provider selection (may choose Claude for quality)
- [ ] Payment details
- [ ] Code output in completion
- [ ] Verification checks for code structure

**Highlight:** "The agent recognized this needs better quality and may have selected the premium provider, or it verified the cheap provider's output was good enough."

### Demo 3: Cost Constraints (1 minute)

**Say:** "Let's demonstrate the spending guardrails."

**Do:**
- [ ] Enter prompt: "Explain quantum physics in detail"
- [ ] Set Max Cost: $0.0001 (very low)
- [ ] Click "Run Agent"

**Show:**
- [ ] Error: "No provider meets constraints" or selects cheapest
- [ ] Guardrails prevented overspending

**Highlight:** "The system enforces your budget constraints - it won't exceed your limits."

### Demo 4: Statistics Dashboard (1 minute)

**Say:** "All spending is tracked and auditable."

**Show:**
- [ ] Stats panel: Total requests
- [ ] Total spend
- [ ] Average cost per request
- [ ] Spend by provider breakdown
- [ ] Point out cost savings

**Highlight:** "Every request is logged in an append-only audit file with transaction hashes for full traceability."

### Demo 5: Onchain Verification (1 minute)

**Say:** "The payments are verifiable onchain."

**Show:**
- [ ] Click a TX hash link in results
- [ ] Explain it would open Arc explorer (placeholder in demo)
- [ ] Point out block number, amount, recipient

**Highlight:** "In production, these are real USDC transactions on Arc L1. Each provider verifies the payment before responding."

---

## Key Talking Points 💡

### Technical Innovation
- [ ] "Autonomous agent makes intelligent routing decisions"
- [ ] "Cost optimization algorithm saves ~77% on average"
- [ ] "Progressive escalation ensures quality"
- [ ] "Blockchain integration provides auditability"

### Business Value
- [ ] "Reduces LLM API costs significantly"
- [ ] "Enforces spending budgets automatically"
- [ ] "Scales to unlimited providers"
- [ ] "Pay-per-use model with verification"

### Production Ready
- [ ] "Multiple layers of security guardrails"
- [ ] "Append-only audit logging"
- [ ] "Replay attack protection"
- [ ] "Emergency stop mechanism"

### Differentiation
- [ ] "Not just routing - intelligent optimization"
- [ ] "Not just payments - verifiable onchain receipts"
- [ ] "Not just cheap - quality-aware with escalation"
- [ ] "Not just theory - working end-to-end demo"

---

## Questions & Answers 🤔

**Q: "Is this using real blockchain transactions?"**
A: "In demo mode, transactions are simulated. But the code is production-ready - just set DEMO_MODE=false and fund the treasury with real USDC on Arc."

**Q: "How do you prevent malicious providers?"**
A: "Provider allowlist, payment verification, nonce tracking, and spending caps. Providers must verify payments onchain before responding."

**Q: "What if all providers fail?"**
A: "The system will try escalation to premium providers. If no provider meets constraints, it returns an error rather than overspending."

**Q: "Can you add more providers?"**
A: "Yes! The architecture is modular. Each provider just needs to implement the /quote and /complete endpoints."

**Q: "How do you measure quality?"**
A: "We use deterministic verification for math/code, and heuristic checks for open-ended tasks. Can be extended with semantic similarity or another LLM as a judge."

**Q: "What about privacy?"**
A: "Prompts go through our router then to providers. For production, you'd add encryption and/or use confidential compute."

---

## Technical Deep Dive (If Asked) 🔧

### Architecture
- [ ] Show ARCHITECTURE.md file
- [ ] Explain microservices design
- [ ] Point out separation of concerns

### Code Quality
- [ ] Show test files
- [ ] Explain type safety (TypeScript 100%)
- [ ] Highlight error handling

### Security
- [ ] Explain spending caps (per-request & daily)
- [ ] Show nonce replay protection
- [ ] Discuss audit logging

### Scalability
- [ ] Explain stateless design
- [ ] Show how to add providers
- [ ] Discuss caching strategy

---

## Troubleshooting During Demo 🔧

**If something breaks:**

**No providers available:**
- [ ] Check provider-wrappers terminal for errors
- [ ] Restart provider services

**Payment failed:**
- [ ] Verify DEMO_MODE=true in .env
- [ ] Check treasury balance (GET /api/treasury)

**Frontend won't load:**
- [ ] Check browser console for errors
- [ ] Verify API calls reaching backend
- [ ] Check CORS configuration

**Slow response:**
- [ ] This is expected for longer prompts
- [ ] Point out latency_ms in results
- [ ] Explain real API calls would vary

---

## Closing (1 minute) 🎉

**Say:** "This MVP demonstrates how AI agents can optimize LLM costs while maintaining quality, with blockchain providing verifiable receipts for every transaction. It's production-ready with security guardrails and can scale to support multiple providers and use cases."

**Show:**
- [ ] Clean UI design
- [ ] All documentation files
- [ ] Test coverage
- [ ] Modular architecture

**Invite:** "The code is open source, fully documented, and ready to run. Check out the README for setup instructions and architecture details."

---

## Post-Demo Follow-Up 📧

**Share:**
- [ ] GitHub repo link (if public)
- [ ] README.md
- [ ] QUICKSTART.md
- [ ] Demo video recording (if available)

**Next Steps:**
- [ ] Production deployment guide
- [ ] Additional provider integrations
- [ ] Advanced verification strategies
- [ ] Monitoring and alerting setup

---

## Backup Prompts (If Needed) 💾

If demos fail, try these proven prompts:

1. **Math:** "Calculate the square root of 144"
2. **Short QA:** "What is the capital of France?"
3. **Code:** "Write a Python function to calculate factorial"
4. **Reasoning:** "Why is the sky blue? Explain in detail."
5. **Writing:** "Write a haiku about coding"

---

## Time Management ⏱️

- **5-minute demo:** Cover Demos 1, 2, and 5
- **10-minute demo:** Cover all 5 demos
- **15-minute demo:** Add technical deep dive
- **Q&A:** Budget 5-10 minutes

---

**Good luck with your demo! 🚀**

Remember: 
- Stay calm if something breaks
- Focus on the value proposition
- Highlight the working end-to-end flow
- Emphasize cost savings and verification

You've got this! 🎉
