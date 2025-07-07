# Ultrathink Web App - Multi-Network Futarchy Platform

A cutting-edge prediction market platform built with Next.js 15, supporting both Polygon Mainnet and Amoy Testnet for next-generation futarchy-based governance and collective intelligence.

## 🚀 Quick Start

```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test

# Lint code
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🌐 Multi-Network Support

### Polygon Mainnet (Production)
- **Chain ID**: 137
- **Currency**: Native MATIC
- **USDC**: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`
- **Use Case**: Real-value prediction market trading

### Polygon Amoy Testnet (Development)
- **Chain ID**: 80002
- **Currency**: Play Token (PT)
- **Contracts**: Fully deployed test environment
- **Use Case**: Development and testing

## 📊 Key Features

### ✅ Implemented Features
- **Multi-Network Support**: Automatic network detection and switching
- **Prediction Market Trading**: LMSR pricing mechanism
- **Portfolio Management**: Real-time balance tracking across networks
- **Admin Dashboard**: Market creation and management
- **Advanced Search & Filtering**: Category-based market discovery
- **Responsive Design**: Mobile-optimized interface
- **Accessibility**: ARIA labels and keyboard navigation

### 🛠️ Technical Stack
- **Next.js 15**: App Router with server components
- **TypeScript**: Complete type safety
- **Tailwind CSS v4**: Modern utility-first styling
- **Ethers.js**: Blockchain integration
- **Recharts**: Price visualization
- **Heroicons**: Icon system

## 🔧 Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
# Multi-Network Configuration
NEXT_PUBLIC_DEFAULT_NETWORK=polygon

# Polygon Mainnet
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_POLYGON_USDC_ADDRESS=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359

# Polygon Amoy Testnet
NEXT_PUBLIC_POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
NEXT_PUBLIC_PLAY_TOKEN_ADDRESS=0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x9f1C3f06B201FFa385a4BB3695f78cB1c17c12db
NEXT_PUBLIC_CONDITIONAL_TOKENS_ADDRESS=0x0416a4757062c1e61759ADDb6d68Af145919F045

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... (see .env.example for complete list)
```

## 🧪 Testing

The project includes comprehensive testing:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

- **Jest**: 40+ comprehensive tests
- **Testing Library**: Component testing
- **t-wada Principles**: Boundary value testing
- **Accessibility Testing**: ARIA compliance

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable React components
├── config/                 # Configuration files
│   └── networks.ts        # Multi-network configuration
├── data/                  # Sample data and constants
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## 🎯 User Workflows

### Polygon Mainnet Usage
1. Connect MetaMask wallet
2. Switch to Polygon Mainnet (automatic)
3. Trade with native MATIC
4. Participate in real-value prediction markets

### Amoy Testnet Usage
1. Connect MetaMask wallet
2. Switch to Polygon Amoy (automatic)
3. Get test POL from faucets
4. Claim 1,000 Play Tokens
5. Trade and test platform features

## 🔗 Related Documentation

- **[Project README](../../README.md)**: Complete Ultrathink platform overview
- **[CLAUDE.md](../../CLAUDE.md)**: Technical specifications and development guidance
- **[vibe.md](../../vibe.md)**: Project guide and setup instructions
- **[Next.js Documentation](https://nextjs.org/docs)**: Framework documentation
- **[Polygon Documentation](https://polygon.technology/developers)**: Network details

## 📝 Development Notes

- **Ultrathink Platform Standards**: Follow TypeScript patterns for type safety
- **Code Conventions**: Adhere to existing patterns and futarchy best practices
- **Multi-Network Testing**: Thoroughly test on both Polygon networks before deploying
- **MetaMask Integration**: Uses direct `window.ethereum` API for lightweight implementation
- **Network Configuration**: Centralized in `src/config/networks.ts` for easy management
- **Futarchy Mathematics**: Implemented in `src/utils/futarchyMath.ts` with LMSR pricing

## ウォレット接続の多重リクエスト防止とエラーハンドリング

- ウォレット接続ボタン（MetaMask 連携）は、二重クリックや連打による多重リクエス
  トを防止するため、`isConnecting`状態でガードしています。
- さらに、`connectWallet`関数の先頭で`isConnecting`が`true`の場合は即リターンし
  、MetaMask 側での多重リクエストエラー（Already processing
  eth_requestAccounts）を防ぎます。
- エラー発生時は、MetaMask から返されるエラーメッセージを含めてユーザーに alert
  で通知します。
