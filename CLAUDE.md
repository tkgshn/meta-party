# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo containing the Ultrathink Futarchy platform - a prediction market-based governance system. The repository includes both reference materials and a full production platform implementation.

### Main Structure
```
/
├── packages/
│   └── contracts/          # Solidity smart contracts (Hardhat + TypeScript)
├── apps/
│   └── web/               # Next.js 14 frontend application
├── functions/             # Firebase Cloud Functions
├── ref/                   # Reference materials and documentation
│   ├── futarchy/         # Legacy demo submodule
│   ├── Mirai-master-plan.md
│   └── v0.md
└── CLAUDE.md             # This file
```

## Development Commands

### Monorepo Management
```bash
# Install all dependencies
npm install

# Run all development servers
npm run dev

# Build all packages
npm run build

# Run tests across all packages
npm run test

# Lint all packages
npm run lint
```

### Smart Contracts (packages/contracts/)
```bash
cd packages/contracts

# Compile contracts
npm run build

# Run tests
npm run test

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet

# Clean artifacts
npm run clean
```

### Frontend Application (apps/web/)
```bash
cd apps/web

# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Firebase Functions (functions/)
```bash
cd functions

# Build TypeScript
npm run build

# Run local emulator
npm run serve

# Deploy to Firebase
npm run deploy

# View logs
npm run logs
```

### Legacy Reference App (ref/futarchy/)
```bash
cd ref/futarchy

# Development server
npm run dev

# Build for production
npm run build
```

### Git Submodule Management
```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/tkgshn/meta-party.git

# Initialize submodules (if already cloned)
git submodule update --init --recursive

# Update submodules to latest
git submodule update --remote
```

## Architecture Overview

### Smart Contracts (Polygon Amoy Testnet) ✅ DEPLOYED
- **PlayToken.sol**: ERC-20 token for platform currency (no real value) - `0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1`
- **MarketFactory.sol**: Factory for creating prediction markets - `0x9f1C3f06B201FFa385a4BB3695f78cB1c17c12db`
- **Market.sol**: Individual market with LMSR pricing mechanism
- **ConditionalTokens**: Gnosis framework for outcome tokens - `0x0416a4757062c1e61759ADDb6d68Af145919F045`

### Frontend (Next.js 15) ✅ WORKING
- **App Router**: Modern Next.js routing with server components
- **Direct MetaMask Integration**: Simplified wallet connection without wagmi/RainbowKit
- **Firebase**: Authentication, database, and cloud functions
- **Tailwind CSS**: Utility-first styling
- **Real-time Balance Checking**: Live Play Token balance updates

### Backend Services
- **Firebase Firestore**: Real-time database for market data
- **Firebase Functions**: Serverless functions for market automation
- **Firebase Auth**: User authentication and authorization

### Key Features ✅ IMPLEMENTED
1. **Play Token Claiming**: Users can claim 1,000 PT once per address ✅
2. **MetaMask Integration**: One-click wallet connection and network switching ✅
3. **Token Auto-Import**: Automatic Play Token addition to MetaMask ✅
4. **Real-time Balance**: Live balance checking and updates ✅
5. **Transaction Monitoring**: Real-time transaction status and confirmation ✅
6. **Error Handling**: Comprehensive error messages and troubleshooting ✅
7. **Market Creation**: Admin interface for creating prediction markets (planned)
8. **Prediction Trading**: LMSR-based trading of outcome tokens (planned)

## Environment Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet
- Firebase project (for backend)

### Required Environment Variables
Copy `apps/web/.env.example` to `apps/web/.env.local` and configure:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... (see .env.example for full list)

# Blockchain Configuration ✅ CONFIGURED
NEXT_PUBLIC_CONDITIONAL_TOKENS_ADDRESS=0x0416a4757062c1e61759ADDb6d68Af145919F045
NEXT_PUBLIC_PLAY_TOKEN_ADDRESS=0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x9f1C3f06B201FFa385a4BB3695f78cB1c17c12db
```

## Development Workflow

1. **Smart Contract Development** ✅ COMPLETE
   - Develop and test contracts in `packages/contracts/` ✅
   - Deploy to Polygon Amoy testnet ✅ (Mumbai deprecated)
   - Update frontend with deployed addresses ✅

2. **Frontend Development** ✅ COMPLETE
   - Use mock data for rapid iteration ✅
   - Connect to deployed contracts ✅
   - Test wallet integration thoroughly ✅

3. **Backend Integration**
   - Set up Firebase project
   - Deploy cloud functions for automation
   - Configure database security rules

## Testing Strategy

### Smart Contracts
- Unit tests with Hardhat and Chai
- Integration tests on testnet
- Gas optimization analysis

### Frontend
- Component testing with Jest
- E2E testing with Playwright (planned)
- Wallet interaction testing

### Backend
- Firebase Functions unit tests
- Database rule testing
- Cloud Function integration tests

## Deployment Process

1. **Contracts**: Deploy to Polygon Amoy (testnet) ✅, then mainnet (planned)
2. **Frontend**: Deploy to Vercel or similar platform (ready for deployment)
3. **Functions**: Deploy to Firebase Cloud Functions (planned)
4. **Database**: Configure Firestore security rules (planned)

## Project Philosophy

Based on the Mirai Master Plan, focusing on:
- **Knowledge Aggregation**: Collecting distributed expertise through prediction markets
- **Execution Capability**: Enabling skilled actors to directly implement solutions
- **Incentive Alignment**: Aligning personal profit with social benefit
- **Credible Neutrality**: Transparent, tamper-resistant governance mechanisms

## Important Notes for Future Claude Code Sessions

1. **Development Commands**: Always use the commands listed above for testing and building
2. **Architecture**: This is a monorepo with contracts and web app - both need to work together
3. **Testing**: All tests should follow t-wada principles and pass before deployment
4. **Environment**: Local development runs on port 3000 (Next.js) - auto-switches to 3001 if 3000 is busy
5. **OpenZeppelin v5**: Use custom error messages instead of string messages (e.g., `OwnableUnauthorizedAccount`)
6. **Ethers v6**: Use `ethers.parseEther()` instead of `ethers.utils.parseEther()`
7. **User Workflow**: Dashboard page with Play Token claiming functionality ✅ IMPLEMENTED
8. **MetaMask Integration**: Use direct `window.ethereum` API, not wagmi/RainbowKit
9. **Network**: Always use Polygon Amoy testnet (Chain ID: 80002), Mumbai is deprecated

## Development Notes

- Use TypeScript throughout for type safety
- Follow existing code patterns and conventions
- Test thoroughly before deploying to mainnet
- Keep security in mind for all user-facing features
- Japanese UI language for target market
- Play tokens have no real monetary value (legal compliance)

## Production Deployment ✅ LIVE

### 🌐 Production URL: https://web-nqr7kd4vi-taka-shunsuke-takagis-projects.vercel.app

**Status**: ✅ Fully operational and publicly accessible
- All features working in production environment
- Environment variables configured
- MetaMask integration functional
- Play Token claiming working

## Session Memory Notes

### Current Platform Status (2025-07-03) ✅ FULLY FUNCTIONAL
1. **Development Environment**:
   - Web app runs with `npm run dev` from root directory (port 3000/3001)
   - All smart contracts deployed to Polygon Amoy testnet
   - Frontend fully integrated with deployed contracts
   - MetaMask integration working perfectly

2. **Deployed Contracts (Polygon Amoy Testnet)**:
   - **PlayToken**: `0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1`
   - **MarketFactory**: `0x9f1C3f06B201FFa385a4BB3695f78cB1c17c12db`
   - **ConditionalTokens**: `0x0416a4757062c1e61759ADDb6d68Af145919F045`
   - **Network**: Polygon Amoy (Chain ID: 80002)

3. **Working Features**:
   - ✅ Wallet connection (direct MetaMask integration)
   - ✅ Network switching to Polygon Amoy
   - ✅ Play Token claiming (1,000 PT per address)
   - ✅ Real-time balance checking
   - ✅ Transaction monitoring and status updates
   - ✅ Token auto-import to MetaMask
   - ✅ Comprehensive error handling
   - ✅ Japanese UI with user-friendly messages

4. **User Workflow**:
   - Install MetaMask → Connect wallet → Switch to Polygon Amoy
   - Get test POL from faucets (Alchemy/Polygon)
   - Visit Dashboard → Claim 1,000 Play Tokens
   - Add token to MetaMask with 🦊 button
   - View balance and transaction history

5. **Technical Implementation**:
   - Direct `window.ethereum` API (no wagmi/RainbowKit)
   - Function selectors: claim() `0x4e71d92d`, hasClaimed() `0x73b2e80e`
   - Duplicate transaction prevention with cooldown
   - Optimistic UI updates with proper error handling
   - Gas price optimization for Amoy testnet

### Successful Test Transaction
- **Hash**: `0xd9b7e95f022fb75a6ba0bd1d128cb10071af64139250db6e992e46d6e14de123`
- **Status**: ✅ Confirmed successfully
- **Result**: 1,000 PT tokens claimed and verified

### Next Steps (Optional)
- Market creation interface implementation
- LMSR trading mechanism integration
- Firebase backend for real-time data
- Production deployment to Vercel