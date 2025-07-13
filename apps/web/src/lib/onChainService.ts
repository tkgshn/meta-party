import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';

// Contract ABIs
const MARKET_FACTORY_ABI = [
  'function getAllMarkets() view returns (address[])',
  'function getMarketCount() view returns (uint256)',
  'function getMarket(uint256) view returns (address)',
  'function createMarket(string,string,uint64,uint64,uint256) returns (address)',
  'function isMarket(address) view returns (bool)',
  'event MarketCreated(address indexed market, string title, string kpiDescription, uint64 tradingDeadline, uint64 resolutionTime, uint256 liquidityParameter)'
] as const;

const MARKET_ABI = [
  'function getMarketInfo() view returns (string,string,uint64,uint64,uint256,uint8,uint256)',
  'function getAllPrices() view returns (uint256[])',
  'function getPrice(uint256) view returns (uint256)',
  'function buy(uint256,uint256)',
  'function calculateCost(uint256,uint256) view returns (uint256)',
  'function phase() view returns (uint8)',
  'function totalFunding() view returns (uint256)',
  'function winningOutcome() view returns (uint256)',
  'function numOutcomes() view returns (uint256)',
  'function tradingDeadline() view returns (uint64)',
  'function resolutionTime() view returns (uint64)',
  'function title() view returns (string)',
  'function kpiDescription() view returns (string)',
  'event Trade(address indexed trader, uint256 indexed outcome, uint256 amount, uint256 cost, uint256 newPrice)'
] as const;

const PLAY_TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
  'function claim()',
  'function hasClaimedTwitter(address) view returns (bool)',
  'function claimWithTwitter(string,address,uint256,uint8,bytes32,bytes32)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
] as const;

const CONDITIONAL_TOKENS_ABI = [
  'function balanceOf(address,uint256) view returns (uint256)',
  'function balanceOfBatch(address[],uint256[]) view returns (uint256[])',
  'function isApprovedForAll(address,address) view returns (bool)',
  'function setApprovalForAll(address,bool)',
  'function safeTransferFrom(address,address,uint256,uint256,bytes)',
  'function safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'
] as const;

// Contract addresses (Sepolia-based configuration)
const CONTRACTS = {
  PLAY_TOKEN: process.env.NEXT_PUBLIC_SEPOLIA_PLAY_TOKEN_ADDRESS || '',
  MARKET_FACTORY: process.env.NEXT_PUBLIC_SEPOLIA_MARKET_FACTORY_ADDRESS || '',
  CONDITIONAL_TOKENS: process.env.NEXT_PUBLIC_SEPOLIA_CONDITIONAL_TOKENS_ADDRESS || ''
};

// Network configuration
const SEPOLIA_CHAIN_ID = 11155111;
const ANVIL_CHAIN_ID = 31337;
// const POLYGON_AMOY_CHAIN_ID = 80002; // Commented out - Amoy support removed

// Market phases
enum MarketPhase {
  TRADING = 0,
  CLOSED = 1,
  RESOLVED = 2
}

// Data types
export interface OnChainMarket {
  address: string;
  title: string;
  kpiDescription: string;
  tradingDeadline: number;
  resolutionTime: number;
  numOutcomes: number;
  phase: MarketPhase;
  winningOutcome: number;
  totalFunding: string;
  prices: string[];
  volume: string;
  participants: number;
  createdAt: number;
  lastUpdated: number;
}

export interface MarketTrade {
  trader: string;
  outcome: number;
  amount: string;
  cost: string;
  newPrice: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

export interface UserPosition {
  marketAddress: string;
  marketTitle: string;
  outcome: number;
  outcomeLabel: string;
  balance: string;
  currentPrice: string;
  value: string;
  unrealizedPnL: string;
}

export interface PlatformStats {
  totalMarkets: number;
  activeMarkets: number;
  totalVolume: string;
  totalParticipants: number;
  totalFunding: string;
  averagePrice: string;
  marketsCreatedToday: number;
  tradesExecutedToday: number;
}

class OnChainService {
  private provider: BrowserProvider | null = null;
  private marketFactoryContract: Contract | null = null;
  private playTokenContract: Contract | null = null;
  private conditionalTokensContract: Contract | null = null;
  private marketContracts: Map<string, Contract> = new Map();

  async initialize(): Promise<void> {
    if (!window.ethereum) {
      console.warn('No ethereum provider detected - users can connect via Reown');
      return;
    }

    this.provider = new BrowserProvider(window.ethereum);
    const network = await this.provider.getNetwork();
    
    const chainId = Number(network.chainId);
    if (chainId !== SEPOLIA_CHAIN_ID && chainId !== ANVIL_CHAIN_ID) {
      throw new Error('Please connect to Sepolia testnet or Anvil local network');
    }

    // Initialize contracts
    this.marketFactoryContract = new Contract(
      CONTRACTS.MARKET_FACTORY,
      MARKET_FACTORY_ABI,
      this.provider
    );

    this.playTokenContract = new Contract(
      CONTRACTS.PLAY_TOKEN,
      PLAY_TOKEN_ABI,
      this.provider
    );

    this.conditionalTokensContract = new Contract(
      CONTRACTS.CONDITIONAL_TOKENS,
      CONDITIONAL_TOKENS_ABI,
      this.provider
    );
  }

  private async getMarketContract(address: string): Promise<Contract> {
    if (!this.marketContracts.has(address)) {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }
      const contract = new Contract(address, MARKET_ABI, this.provider);
      this.marketContracts.set(address, contract);
    }
    return this.marketContracts.get(address)!;
  }

  // Get all markets from the factory
  async getAllMarkets(): Promise<OnChainMarket[]> {
    if (!this.marketFactoryContract) {
      console.warn('OnChain service not initialized - using fallback data');
      return [];
    }

    const marketAddresses = await this.marketFactoryContract.getAllMarkets();
    const markets: OnChainMarket[] = [];

    for (const address of marketAddresses) {
      try {
        const market = await this.getMarketData(address);
        markets.push(market);
      } catch (error) {
        console.error(`Failed to get market data for ${address}:`, error);
      }
    }

    return markets.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Get detailed market data
  async getMarketData(marketAddress: string): Promise<OnChainMarket> {
    const marketContract = await this.getMarketContract(marketAddress);
    
    const [
      [title, kpiDescription, tradingDeadline, resolutionTime, numOutcomes, phase, winningOutcome],
      prices,
      totalFunding
    ] = await Promise.all([
      marketContract.getMarketInfo(),
      marketContract.getAllPrices(),
      marketContract.totalFunding()
    ]);

    // Calculate volume and participants from events
    const { volume, participants } = await this.getMarketStats(marketAddress);

    return {
      address: marketAddress,
      title,
      kpiDescription,
      tradingDeadline: Number(tradingDeadline),
      resolutionTime: Number(resolutionTime),
      numOutcomes: Number(numOutcomes),
      phase: Number(phase),
      winningOutcome: Number(winningOutcome),
      totalFunding: formatUnits(totalFunding, 18),
      prices: prices.map((price: bigint) => formatUnits(price, 18)),
      volume,
      participants,
      createdAt: Date.now(), // Would need to get from creation event
      lastUpdated: Date.now()
    };
  }

  // Get market statistics from events
  async getMarketStats(marketAddress: string): Promise<{ volume: string; participants: number }> {
    const marketContract = await this.getMarketContract(marketAddress);
    
    try {
      // Get all trade events
      const filter = marketContract.filters.Trade();
      const events = await marketContract.queryFilter(filter);
      
      let totalVolume = BigInt(0);
      const uniqueTraders = new Set<string>();
      
      events.forEach(event => {
        if (event.args) {
          totalVolume += BigInt(event.args.cost);
          uniqueTraders.add(event.args.trader);
        }
      });

      return {
        volume: formatUnits(totalVolume, 18),
        participants: uniqueTraders.size
      };
    } catch (error) {
      console.error('Failed to get market stats:', error);
      return { volume: '0', participants: 0 };
    }
  }

  // Get market trading history
  async getMarketTrades(marketAddress: string, limit = 100): Promise<MarketTrade[]> {
    const marketContract = await this.getMarketContract(marketAddress);
    
    const filter = marketContract.filters.Trade();
    const events = await marketContract.queryFilter(filter);
    
    const trades: MarketTrade[] = [];
    
    for (const event of events.slice(-limit)) {
      if (event.args) {
        trades.push({
          trader: event.args.trader,
          outcome: Number(event.args.outcome),
          amount: formatUnits(event.args.amount, 18),
          cost: formatUnits(event.args.cost, 18),
          newPrice: formatUnits(event.args.newPrice, 18),
          timestamp: Date.now(), // Would need to get from block
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }
    }

    return trades.reverse();
  }

  // Execute buy order
  async buyOutcome(
    marketAddress: string,
    outcome: number,
    amount: string,
    account: string
  ): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet connection required for trading. Please connect via MetaMask or Reown.');
    }

    const signer = await this.provider.getSigner();
    const marketContract = await this.getMarketContract(marketAddress);
    const marketContractWithSigner = marketContract.connect(signer);
    
    const amountWei = parseUnits(amount, 18);
    const cost = await marketContract.calculateCost(outcome, amountWei);
    
    // Check PlayToken balance
    const playTokenBalance = await this.playTokenContract!.balanceOf(account);
    if (playTokenBalance < cost) {
      throw new Error('Insufficient PlayToken balance');
    }

    // Check and approve PlayToken if needed
    const allowance = await this.playTokenContract!.allowance(account, marketAddress);
    if (allowance < cost) {
      const playTokenWithSigner = this.playTokenContract!.connect(signer);
      const approveTx = await playTokenWithSigner.approve(marketAddress, cost);
      await approveTx.wait();
    }

    // Execute buy
    const tx = await marketContractWithSigner.buy(outcome, amountWei);
    await tx.wait();
    
    return tx.hash;
  }

  // Get user positions
  async getUserPositions(account: string): Promise<UserPosition[]> {
    const markets = await this.getAllMarkets();
    const positions: UserPosition[] = [];

    for (const market of markets) {
      try {
        const marketContract = await this.getMarketContract(market.address);
        
        for (let outcome = 0; outcome < market.numOutcomes; outcome++) {
          // Get position token balance from ConditionalTokens
          // This would require knowing the position token ID
          // For now, we'll skip this implementation
        }
      } catch (error) {
        console.error(`Failed to get positions for market ${market.address}:`, error);
      }
    }

    return positions;
  }

  // Get platform-wide statistics
  async getPlatformStats(): Promise<PlatformStats> {
    const markets = await this.getAllMarkets();
    
    const totalMarkets = markets.length;
    const activeMarkets = markets.filter(m => m.phase === MarketPhase.TRADING).length;
    
    let totalVolume = BigInt(0);
    let totalParticipants = 0;
    let totalFunding = BigInt(0);
    
    const participantSet = new Set<string>();
    
    for (const market of markets) {
      totalVolume += parseUnits(market.volume, 18);
      totalFunding += parseUnits(market.totalFunding, 18);
      
      // Get unique participants
      const trades = await this.getMarketTrades(market.address);
      trades.forEach(trade => participantSet.add(trade.trader));
    }
    
    totalParticipants = participantSet.size;
    
    // Calculate today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const marketsCreatedToday = markets.filter(m => m.createdAt >= todayTimestamp).length;
    
    let tradesExecutedToday = 0;
    for (const market of markets) {
      const trades = await this.getMarketTrades(market.address);
      tradesExecutedToday += trades.filter(t => t.timestamp >= todayTimestamp).length;
    }

    return {
      totalMarkets,
      activeMarkets,
      totalVolume: formatUnits(totalVolume, 18),
      totalParticipants,
      totalFunding: formatUnits(totalFunding, 18),
      averagePrice: markets.length > 0 ? '0.5' : '0', // Simplified
      marketsCreatedToday,
      tradesExecutedToday
    };
  }

  // Create new market (admin only)
  async createMarket(
    title: string,
    kpiDescription: string,
    tradingDeadline: number,
    resolutionTime: number,
    numOutcomes: number,
    account: string
  ): Promise<string> {
    if (!this.provider || !this.marketFactoryContract) {
      throw new Error('Wallet connection required for market creation. Please connect via MetaMask or Reown.');
    }

    const signer = await this.provider.getSigner();
    const factoryWithSigner = this.marketFactoryContract.connect(signer);
    
    const tx = await factoryWithSigner.createMarket(
      title,
      kpiDescription,
      tradingDeadline,
      resolutionTime,
      numOutcomes
    );
    
    const receipt = await tx.wait();
    
    // Get market address from events
    const event = receipt.logs.find((log: any) => log.eventName === 'MarketCreated');
    if (event && event.args) {
      return event.args.market;
    }
    
    throw new Error('Failed to create market');
  }

  // Get user's PlayToken balance
  async getPlayTokenBalance(account: string): Promise<string> {
    if (!this.playTokenContract) {
      console.warn('PlayToken contract not initialized');
      return '0';
    }

    const balance = await this.playTokenContract.balanceOf(account);
    return formatUnits(balance, 18);
  }

  // Claim PlayToken (if available)
  async claimPlayToken(account: string): Promise<string> {
    if (!this.provider || !this.playTokenContract) {
      throw new Error('Wallet connection required for this operation. Please connect via MetaMask or Reown.');
    }

    const signer = await this.provider.getSigner();
    const tokenWithSigner = this.playTokenContract.connect(signer);
    
    const tx = await tokenWithSigner.claim();
    await tx.wait();
    
    return tx.hash;
  }

  // Check if user has claimed PlayToken
  async hasClaimedPlayToken(account: string): Promise<boolean> {
    if (!this.playTokenContract) {
      console.warn('PlayToken contract not initialized');
      return false;
    }

    try {
      return await this.playTokenContract.hasClaimedTwitter(account);
    } catch (error) {
      // If method doesn't exist, assume false
      return false;
    }
  }
}

// Export singleton instance
export const onChainService = new OnChainService();

// Export types
export { MarketPhase };