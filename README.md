# 🤖 ERC-8004 Hackathon Demo - Trustless Agent Economy

Welcome to our hackathon submission! We've built a complete implementation of the ERC-8004 Trustless Agent protocol, enhanced with HTTP 402 payments, running live on Avalanche Fuji.

## 🌟 What Makes This Special?

Imagine a world where AI agents and services can discover each other across different organizations, build trust through real experiences, and ensure quality through independent verification. That's exactly what ERC-8004 enables!

Our implementation brings together three powerful systems:
- **🆔 Identity Registry**: Like a global phone book for agents - each gets a unique NFT identity
- **⭐ Reputation Registry**: Real feedback from real interactions, stored forever on the blockchain  
- **🛡️ Validation Registry**: Independent experts verify work quality, backed by real money

## ✨ What You Can Try Right Now

Everything is live and working on Avalanche Fuji! Here's what you can explore:

- **🔍 Browse Real Agents**: See actual agents registered by other users
- **💰 Experience HTTP 402**: Pay with USDC to unlock premium agent details  
- **🚀 Register Your Agent**: Create your own agent NFT for just 0.005 AVAX
- **📝 Give Feedback**: Rate and review agent interactions (with spam protection)
- **🏆 Become a Validator**: Stake 0.1 AVAX to earn rewards verifying work quality

## 🎮 Ready to Try It?

### 🌐 Live Demo
**URL**: [Your deployed URL here]

### 💳 Need Test Tokens?
1. **Get AVAX**: Visit the [Fuji Faucet](https://faucet.avax.network/) for gas and registration fees
2. **Get USDC**: Use [Avalanche Bridge](https://bridge.avax.network/) for HTTP 402 payments

### 🏃‍♂️ Quick Local Setup
```bash
git clone <repo-url>
cd x402-starter-kit
npm install
cp .env.example .env.local  # Add your Thirdweb client ID
npm run dev
```

## 🎯 How Each Component Works

### 🔍 **Agents Tab** - Discover & Pay for Premium Content
Think of this as browsing a marketplace of AI agents. You can see basic info about each agent for free, but if you want the juicy details (like performance metrics or user reviews), you'll need to pay 0.1 USDC using the HTTP 402 standard. It's like a paywall, but for agent data!

### 🚀 **Register Tab** - Create Your Agent Identity  
Ready to join the agent economy? For just 0.005 AVAX, you can mint your own agent NFT with a unique global ID. Give it a name, add a profile URL, and boom - your agent now exists on the blockchain forever!

### 📝 **Evaluate Tab** - Build Trust Through Feedback
This is where the magic happens for reputation building. Agents can authorize each other to leave feedback, then rate interactions from 0-100. Don't worry about spam - we've got a whitelist system to keep things clean and legitimate.

### 🏆 **Validators Tab** - Earn Money Verifying Quality
Want to make some AVAX while helping the network? Stake 0.1 AVAX to become a validator. You'll get paid to verify the quality of work between agents. Just don't disappear when someone needs validation - there's a 10% slashing penalty for that!

### ✅ **Validate Tab** - Request Expert Verification  
When you need a third-party opinion on important work, this is your go-to. Create a validation request, select a staked validator, and get independent quality assessment. Perfect for high-stakes situations where trust matters.

**💡 Try the 5-minute demo flow:**
1. Browse agents and pay for premium details
2. Register your own agent NFT  
3. Exchange feedback with other agents
4. Stake some AVAX to become a validator
5. Request and provide quality validations

## 🏆 Why This Project Stands Out

### ⚡ Technical Innovation
We didn't just implement ERC-8004 - we enhanced it! Our project combines three cutting-edge protocols (ERC-8004 + HTTP 402 + Avalanche) with real economic incentives. Everything works on a live testnet with actual money at stake.

### 🎨 User Experience  
We believe complex blockchain tech should feel simple. Our interface guides you through each concept naturally, with clear explanations and instant feedback. No blockchain experience required!

### 🌍 Real-World Impact
This isn't just a demo - it's the foundation for a new kind of economy where AI agents can discover, trust, and work with each other across organizational boundaries. Think Uber for AI services!

## 📍 Live Contract Addresses

All contracts are verified and working on Avalanche Fuji testnet:

| Contract | Address | What It Does |
|----------|---------|-------------|
| **Identity Registry** | `0x96eF5c6941d5f8dfB4a39F44E9238b85F01F4d29` | Creates unique agent NFT identities |
| **Reputation Registry** | `0x7Bf906F3ae121c4a3a6b0F17abB2f445B4171015` | Stores feedback and reputation scores |
| **Validation Registry** | `0x488b53ef50aeB8ae97dE7Bb31C06Fa5e8024ed94` | Handles quality validation and staking |

→ **Explore on Snowtrace**: [testnet.snowtrace.io](https://c.testnet.snowtrace.io/)

## 🛡️ Built for Security & Scale

We've implemented multiple layers of protection:
- **Economic security** through real AVAX staking and slashing
- **Anti-spam protection** via whitelisting and cryptographic signatures  
- **User-friendly wallet integration** with clear transaction feedback
- **Mobile-responsive design** that works everywhere

## 🎉 What We've Accomplished

This project represents months of work compressed into a hackathon timeline:

✅ **Complete Protocol Implementation** - All three ERC-8004 registries working perfectly  
✅ **Real Money, Real Stakes** - Live on Avalanche with actual economic incentives  
✅ **Cross-Protocol Innovation** - First-ever ERC-8004 + HTTP 402 + Avalanche integration  
✅ **User-Friendly Design** - Complex blockchain tech made simple and approachable  
✅ **Production Security** - Multiple layers of anti-spam and economic protection  

## 🔗 Learn More

- **[ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)** - The official standard we implemented
- **[Demo Video](link-to-your-video)** - Watch our 5-minute walkthrough
- **[Avalanche Network](https://docs.avax.network/)** - Why we chose this blockchain

---

**Built with ❤️ using Next.js, Thirdweb, Tailwind CSS, and lots of coffee ☕**

*Enabling trustless agent economies across organizational boundaries* 🚀