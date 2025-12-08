# ERC-8004 Hackathon Demo - Trustless Agent Registry

🏆 **Hackathon Project**: A complete implementation of ERC-8004 Trustless Agent protocol with HTTP 402 Payment Required standard on Avalanche Fuji testnet.

## 🚀 What is ERC-8004?

ERC-8004 enables **cross-organizational agent discovery and trust** through three core registries:

1. **Identity Registry**: Agent discovery via ERC-721 NFTs with global unique IDs
2. **Reputation Registry**: Client-server feedback system with on-chain reputation
3. **Validation Registry**: Independent work quality verification by staked validators

## 🎯 Hackathon Demo Features

### Live on Avalanche Fuji
- **Real Contracts**: Fully deployed and functional ERC-8004 registries
- **Agent Registration**: Mint agent NFTs for 0.005 AVAX
- **Feedback System**: Submit and authorize evaluations with spam protection
- **Validator Network**: Stake 0.1 AVAX to become a quality validator
- **HTTP 402 Payments**: USDC-gated premium content access

## 🎮 Try the Demo Now

### 🌐 Live Demo
**URL**: [Your deployed URL here]

### 💳 Get Test Funds
1. **AVAX**: [Fuji Faucet](https://faucet.avax.network/) - for gas and registration fees
2. **USDC**: [Avalanche Bridge](https://bridge.avax.network/) - for HTTP 402 payments

### 🏃‍♂️ Quick Start (Local Development)

```bash
# Clone and run
git clone <repo-url>
cd x402-starter-kit
npm install
cp .env.example .env.local  # Add your Thirdweb client ID
npm run dev
```

**Demo Flow** (5 minutes):
1. **Agents**: Browse existing agents, pay 0.1 USDC for details
2. **Register**: Create your agent NFT for 0.005 AVAX  
3. **Evaluate**: Submit feedback between agents (requires whitelist)
4. **Validators**: Stake 0.1 AVAX to become a validator
5. **Validate**: Request and respond to quality validations

## 📋 Hackathon Judging Criteria

### ✅ Technical Innovation
- **Full ERC-8004 Implementation**: All three registries working on live testnet
- **Cross-Protocol Integration**: ERC-8004 + HTTP 402 Payment Required + Avalanche
- **Real Economic Incentives**: Staking, slashing, and payment mechanisms

### ✅ User Experience  
- **Intuitive UI**: Clean, responsive design with real-time feedback
- **Wallet Integration**: Seamless MetaMask connection and transaction flow
- **Educational**: Clear explanation of concepts while using

### ✅ Practical Use Cases
- **Agent Discovery**: Find and interact with agents across organizations
- **Trust Building**: Reputation system for service quality
- **Quality Assurance**: Independent validation for high-stakes work

## 📊 Contract Addresses (Avalanche Fuji)

| Contract | Address | Purpose |
|----------|---------|---------|
| **Identity Registry** | `0x96eF5c6941d5f8dfB4a39F44E9238b85F01F4d29` | Agent NFT registration |
| **Reputation Registry** | `0x7Bf906F3ae121c4a3a6b0F17abB2f445B4171015` | Feedback & reputation |
| **Validation Registry** | `0x488b53ef50aeB8ae97dE7Bb31C06Fa5e8024ed94` | Quality validation |

🔍 **Verify on Snowtrace**: [c.testnet.snowtrace.io](https://c.testnet.snowtrace.io/)

## 🏗️ Architecture Highlights

### Smart Contract Security
- **Ownership Verification**: Only agent owners can perform sensitive operations
- **Economic Security**: Stake-backed validators with slashing penalties  
- **Anti-Spam**: Whitelist protection for feedback submissions
- **Access Control**: Multi-layered permission system

### Frontend Innovation
- **Real-time Validation**: Live agent lookup from blockchain
- **Payment Integration**: HTTP 402 with automatic USDC handling
- **Transaction Feedback**: Clear success/failure messaging with Snowtrace links
- **Responsive Design**: Mobile-friendly interface

## 🎉 Hackathon Achievements

✅ **Full ERC-8004 Implementation**: Complete three-registry system  
✅ **Live Deployment**: Working contracts on Avalanche Fuji  
✅ **Economic Incentives**: Real staking, fees, and rewards  
✅ **Cross-Protocol**: ERC-8004 + HTTP 402 Payment Required + Avalanche integration  
✅ **Production Ready**: Security considerations and error handling  
✅ **Educational**: Clear UX that teaches ERC-8004 concepts  

## 🔗 Resources

- **[ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)** - Official proposal
- **[Demo Video](link-to-your-video)** - 5-minute walkthrough
- **[Presentation Slides](link-to-slides)** - Technical overview
- **[Avalanche Docs](https://docs.avax.network/)** - Network details

## 🏆 Built for Hackathon

**Team**: [Your team name]  
**Track**: [Hackathon track]  
**Built with**: Next.js, Thirdweb, Tailwind CSS, ERC-8004, HTTP 402 Payment Required, Avalanche

---

🚀 **Enabling trustless agent economies across organizational boundaries**