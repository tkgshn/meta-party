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

### Smart Contracts (Polygon)
- **PlayToken.sol**: ERC-20 token for platform currency (no real value)
- **MarketFactory.sol**: Factory for creating prediction markets
- **Market.sol**: Individual market with LMSR pricing mechanism
- **ConditionalTokens**: Gnosis framework for outcome tokens

### Frontend (Next.js 14)
- **App Router**: Modern Next.js routing with server components
- **RainbowKit**: Wallet connection and management
- **Wagmi**: React hooks for Ethereum interactions
- **Firebase**: Authentication, database, and cloud functions
- **Tailwind CSS**: Utility-first styling

### Backend Services
- **Firebase Firestore**: Real-time database for market data
- **Firebase Functions**: Serverless functions for market automation
- **Firebase Auth**: User authentication and authorization

### Key Features
1. **Market Creation**: Admin interface for creating prediction markets
2. **Prediction Trading**: LMSR-based trading of outcome tokens
3. **Play Token System**: Free tokens for testing (1,000 PT per user)
4. **Real-time Updates**: Live market data and price feeds
5. **Market Resolution**: Oracle-based outcome determination

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

# Blockchain Configuration (after contract deployment)
NEXT_PUBLIC_PLAY_TOKEN_ADDRESS=deployed_contract_address
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=deployed_contract_address
```

## Development Workflow

1. **Smart Contract Development**
   - Develop and test contracts in `packages/contracts/`
   - Deploy to Polygon Mumbai testnet first
   - Update frontend with deployed addresses

2. **Frontend Development**
   - Use mock data for rapid iteration
   - Connect to deployed contracts once ready
   - Test wallet integration thoroughly

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

1. **Contracts**: Deploy to Polygon Mumbai, then mainnet
2. **Frontend**: Deploy to Vercel or similar platform
3. **Functions**: Deploy to Firebase Cloud Functions
4. **Database**: Configure Firestore security rules

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
4. **Environment**: Local development runs on port 3001 (Next.js)
5. **OpenZeppelin v5**: Use custom error messages instead of string messages (e.g., `OwnableUnauthorizedAccount`)
6. **Ethers v6**: Use `ethers.parseEther()` instead of `ethers.utils.parseEther()`
7. **User Workflow**: Dashboard page needs implementation for Play Token claiming functionality

## Development Notes

- Use TypeScript throughout for type safety
- Follow existing code patterns and conventions
- Test thoroughly before deploying to mainnet
- Keep security in mind for all user-facing features
- Japanese UI language for target market
- Play tokens have no real monetary value (legal compliance)

## Session Memory Notes

### Web App Status and Setup (2025-07-03)
1. **Current Status**: Web app can be started with `npm run dev` from root directory (port 3000)
2. **Required Setup**:
   - Create Firebase project at https://console.firebase.google.com/
   - Copy `.env.example` to `.env.local` and configure Firebase credentials
   - Deploy smart contracts to testnet first: `cd packages/contracts && npm run deploy:testnet`
   - Add deployed contract addresses to `.env.local`
3. **MetaMask Integration**:
   - Users need MetaMask installed
   - Connect to Polygon Mumbai testnet
   - Get test MATIC from https://faucet.polygon.technology/
   - Claim 1,000 Play Tokens from Dashboard
4. **Important**: Always run lint and typecheck commands after making changes