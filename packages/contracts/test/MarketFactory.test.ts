import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

/**
 * MarketFactory Contract Tests
 * 
 * Following t-wada testing principles:
 * - Clear test names describing expected behavior
 * - Arrange-Act-Assert pattern
 * - Boundary value testing
 * - Edge case coverage
 */
describe("MarketFactory", function () {
  let marketFactory: Contract;
  let playToken: Contract;
  let conditionalTokens: Contract;
  let owner: Signer;
  let oracle: Signer;
  let user1: Signer;
  let ownerAddress: string;
  let oracleAddress: string;
  let user1Address: string;

  // Constants for better test readability
  const DEFAULT_LIQUIDITY_PARAMETER = ethers.parseEther("1000");
  const ZERO_ADDRESS = ethers.ZeroAddress;

  beforeEach(async function () {
    // Arrange: Set up test environment
    [owner, oracle, user1] = await ethers.getSigners();
    [ownerAddress, oracleAddress, user1Address] = await Promise.all([
      owner.getAddress(),
      oracle.getAddress(),
      user1.getAddress()
    ]);

    // Deploy dependencies
    const PlayToken = await ethers.getContractFactory("PlayToken");
    playToken = await PlayToken.deploy();
    await playToken.deploymentTransaction()?.wait();

    // Deploy mock ConditionalTokens (in production, use the real one)
    const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
    conditionalTokens = await ConditionalTokens.deploy();
    await conditionalTokens.deploymentTransaction()?.wait();

    // Deploy MarketFactory
    const MarketFactory = await ethers.getContractFactory("MarketFactory");
    marketFactory = await MarketFactory.deploy(
      await playToken.getAddress(),
      oracleAddress,
      await conditionalTokens.getAddress()
    );
    await marketFactory.deploymentTransaction()?.wait();
  });

  describe("Contract Deployment (契約デプロイ)", function () {
    it("デプロイ時に正しい初期値が設定される", async function () {
      // Assert: Check initial state
      expect(await marketFactory.playToken()).to.equal(await playToken.getAddress());
      expect(await marketFactory.oracle()).to.equal(oracleAddress);
      expect(await marketFactory.conditionalTokens()).to.equal(await conditionalTokens.getAddress());
      expect(await marketFactory.b()).to.equal(DEFAULT_LIQUIDITY_PARAMETER);
      expect(await marketFactory.getMarketCount()).to.equal(0);
    });

    it("デプロイヤーがオーナーになる", async function () {
      // Assert
      expect(await marketFactory.owner()).to.equal(ownerAddress);
    });

    it("無効なPlayTokenアドレスでのデプロイは失敗する", async function () {
      // Arrange
      const MarketFactory = await ethers.getContractFactory("MarketFactory");
      
      // Act & Assert
      await expect(MarketFactory.deploy(ZERO_ADDRESS, oracleAddress, conditionalTokensgetAddress()))
        .to.be.revertedWith("MarketFactory: Invalid PlayToken address");
    });

    it("無効なオラクルアドレスでのデプロイは失敗する", async function () {
      // Arrange
      const MarketFactory = await ethers.getContractFactory("MarketFactory");
      
      // Act & Assert
      await expect(MarketFactory.deploy(playTokengetAddress(), ZERO_ADDRESS, conditionalTokensgetAddress()))
        .to.be.revertedWith("MarketFactory: Invalid oracle address");
    });

    it("無効なConditionalTokensアドレスでのデプロイは失敗する", async function () {
      // Arrange
      const MarketFactory = await ethers.getContractFactory("MarketFactory");
      
      // Act & Assert
      await expect(MarketFactory.deploy(playTokengetAddress(), oracleAddress, ZERO_ADDRESS))
        .to.be.revertedWith("MarketFactory: Invalid ConditionalTokens address");
    });
  });

  describe("Market Creation (市場作成)", function () {
    const validMarketParams = {
      title: "Test Market",
      kpiDescription: "Test KPI Description",
      tradingDeadline: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
      resolutionTime: Math.floor(Date.now() / 1000) + 8 * 24 * 60 * 60, // 8 days from now
      numOutcomes: 3
    };

    it("オーナーは有効なパラメータで市場を作成できる", async function () {
      // Act
      const tx = await marketFactory.createMarket(
        validMarketParams.title,
        validMarketParams.kpiDescription,
        validMarketParams.tradingDeadline,
        validMarketParams.resolutionTime,
        validMarketParams.numOutcomes
      );
      const receipt = await tx.wait();

      // Assert: Event should be emitted
      const marketCreatedEvent = receipt.events?.find((e: any) => e.event === "MarketCreated");
      expect(marketCreatedEvent).to.exist;

      // Assert: Market count should increase
      expect(await marketFactory.getMarketCount()).to.equal(1);

      // Assert: Market should be tracked
      const marketAddress = await marketFactory.getMarket(0);
      expect(await marketFactory.isMarket(marketAddress)).to.be.true;
    });

    it("市場作成時にMarketCreatedイベントが正しいパラメータで発行される", async function () {
      // Act & Assert
      await expect(marketFactory.createMarket(
        validMarketParams.title,
        validMarketParams.kpiDescription,
        validMarketParams.tradingDeadline,
        validMarketParams.resolutionTime,
        validMarketParams.numOutcomes
      )).to.emit(marketFactory, "MarketCreated");
    });

    it("非オーナーは市場を作成できない", async function () {
      // Act & Assert
      await expect(marketFactory.connect(user1).createMarket(
        validMarketParams.title,
        validMarketParams.kpiDescription,
        validMarketParams.tradingDeadline,
        validMarketParams.resolutionTime,
        validMarketParams.numOutcomes
      )).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("空のタイトルでの市場作成は失敗する", async function () {
      // Act & Assert
      await expect(marketFactory.createMarket(
        "",
        validMarketParams.kpiDescription,
        validMarketParams.tradingDeadline,
        validMarketParams.resolutionTime,
        validMarketParams.numOutcomes
      )).to.be.revertedWith("MarketFactory: Title cannot be empty");
    });

    it("空のKPI説明での市場作成は失敗する", async function () {
      // Act & Assert
      await expect(marketFactory.createMarket(
        validMarketParams.title,
        "",
        validMarketParams.tradingDeadline,
        validMarketParams.resolutionTime,
        validMarketParams.numOutcomes
      )).to.be.revertedWith("MarketFactory: KPI description cannot be empty");
    });

    it("過去の取引締切時間での市場作成は失敗する", async function () {
      // Arrange: Past deadline
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      // Act & Assert
      await expect(marketFactory.createMarket(
        validMarketParams.title,
        validMarketParams.kpiDescription,
        pastDeadline,
        validMarketParams.resolutionTime,
        validMarketParams.numOutcomes
      )).to.be.revertedWith("MarketFactory: Trading deadline must be in the future");
    });

    it("取引締切より前の解決時間での市場作成は失敗する", async function () {
      // Arrange: Resolution time before deadline
      const invalidResolutionTime = validMarketParams.tradingDeadline - 3600; // 1 hour before deadline
      
      // Act & Assert
      await expect(marketFactory.createMarket(
        validMarketParams.title,
        validMarketParams.kpiDescription,
        validMarketParams.tradingDeadline,
        invalidResolutionTime,
        validMarketParams.numOutcomes
      )).to.be.revertedWith("MarketFactory: Resolution time must be after trading deadline");
    });

    it("結果数が2未満の市場作成は失敗する", async function () {
      // Act & Assert
      await expect(marketFactory.createMarket(
        validMarketParams.title,
        validMarketParams.kpiDescription,
        validMarketParams.tradingDeadline,
        validMarketParams.resolutionTime,
        1 // Invalid: less than 2
      )).to.be.revertedWith("MarketFactory: Must have at least 2 outcomes");
    });

    it("結果数が100を超える市場作成は失敗する", async function () {
      // Act & Assert
      await expect(marketFactory.createMarket(
        validMarketParams.title,
        validMarketParams.kpiDescription,
        validMarketParams.tradingDeadline,
        validMarketParams.resolutionTime,
        101 // Invalid: more than 100
      )).to.be.revertedWith("MarketFactory: Too many outcomes");
    });

    it("複数の市場を連続で作成できる", async function () {
      // Arrange
      const numMarkets = 5;
      
      // Act: Create multiple markets
      for (let i = 0; i < numMarkets; i++) {
        await marketFactory.createMarket(
          `Market ${i}`,
          validMarketParams.kpiDescription,
          validMarketParams.tradingDeadline + i * 3600, // Stagger deadlines
          validMarketParams.resolutionTime + i * 3600,
          validMarketParams.numOutcomes
        );
      }
      
      // Assert
      expect(await marketFactory.getMarketCount()).to.equal(numMarkets);
      
      // Assert: All markets are tracked
      for (let i = 0; i < numMarkets; i++) {
        const marketAddress = await marketFactory.getMarket(i);
        expect(await marketFactory.isMarket(marketAddress)).to.be.true;
      }
    });
  });

  describe("Oracle Management (オラクル管理)", function () {
    it("オーナーはオラクルアドレスを変更できる", async function () {
      // Arrange
      const newOracle = user1Address;
      
      // Act
      await marketFactory.setOracle(newOracle);
      
      // Assert
      expect(await marketFactory.oracle()).to.equal(newOracle);
    });

    it("オラクル変更時にOracleChangedイベントが発行される", async function () {
      // Arrange
      const newOracle = user1Address;
      
      // Act & Assert
      await expect(marketFactory.setOracle(newOracle))
        .to.emit(marketFactory, "OracleChanged")
        .withArgs(oracleAddress, newOracle);
    });

    it("非オーナーはオラクルアドレスを変更できない", async function () {
      // Act & Assert
      await expect(marketFactory.connect(user1).setOracle(user1Address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("ゼロアドレスへのオラクル変更は失敗する", async function () {
      // Act & Assert
      await expect(marketFactory.setOracle(ZERO_ADDRESS))
        .to.be.revertedWith("MarketFactory: Invalid oracle address");
    });
  });

  describe("Liquidity Parameter Management (流動性パラメータ管理)", function () {
    it("オーナーは流動性パラメータを変更できる", async function () {
      // Arrange
      const newB = ethers.parseEther("2000");
      
      // Act
      await marketFactory.setLiquidityParameter(newB);
      
      // Assert
      expect(await marketFactory.b()).to.equal(newB);
    });

    it("流動性パラメータ変更時にLiquidityParameterChangedイベントが発行される", async function () {
      // Arrange
      const newB = ethers.parseEther("2000");
      
      // Act & Assert
      await expect(marketFactory.setLiquidityParameter(newB))
        .to.emit(marketFactory, "LiquidityParameterChanged")
        .withArgs(DEFAULT_LIQUIDITY_PARAMETER, newB);
    });

    it("非オーナーは流動性パラメータを変更できない", async function () {
      // Arrange
      const newB = ethers.parseEther("2000");
      
      // Act & Assert
      await expect(marketFactory.connect(user1).setLiquidityParameter(newB))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("ゼロの流動性パラメータ設定は失敗する", async function () {
      // Act & Assert
      await expect(marketFactory.setLiquidityParameter(0))
        .to.be.revertedWith("MarketFactory: Liquidity parameter must be greater than 0");
    });

    it("極大値の流動性パラメータも設定できる", async function () {
      // Arrange
      const maxB = ethers.MaxUint256 / 1000n; // Reasonable max to avoid overflow
      
      // Act
      await marketFactory.setLiquidityParameter(maxB);
      
      // Assert
      expect(await marketFactory.b()).to.equal(maxB);
    });
  });

  describe("Market Querying (市場クエリ)", function () {
    beforeEach(async function () {
      // Create some test markets
      const validParams = {
        title: "Test Market",
        kpiDescription: "Test KPI",
        tradingDeadline: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        resolutionTime: Math.floor(Date.now() / 1000) + 8 * 24 * 60 * 60,
        numOutcomes: 3
      };

      for (let i = 0; i < 3; i++) {
        await marketFactory.createMarket(
          `${validParams.title} ${i}`,
          validParams.kpiDescription,
          validParams.tradingDeadline,
          validParams.resolutionTime,
          validParams.numOutcomes
        );
      }
    });

    it("getAllMarketsは作成されたすべての市場を返す", async function () {
      // Act
      const allMarkets = await marketFactory.getAllMarkets();
      
      // Assert
      expect(allMarkets.length).to.equal(3);
      
      // Assert: Each address should be a valid market
      for (const marketAddress of allMarkets) {
        expect(await marketFactory.isMarket(marketAddress)).to.be.true;
      }
    });

    it("getMarketは指定されたインデックスの市場を返す", async function () {
      // Act
      const firstMarket = await marketFactory.getMarket(0);
      const lastMarket = await marketFactory.getMarket(2);
      
      // Assert
      expect(await marketFactory.isMarket(firstMarket)).to.be.true;
      expect(await marketFactory.isMarket(lastMarket)).to.be.true;
      expect(firstMarket).to.not.equal(lastMarket);
    });

    it("範囲外のインデックスでgetMarketを呼ぶと失敗する", async function () {
      // Act & Assert
      await expect(marketFactory.getMarket(10))
        .to.be.revertedWith("MarketFactory: Market index out of bounds");
    });

    it("getMarketCountは正しい市場数を返す", async function () {
      // Act & Assert
      expect(await marketFactory.getMarketCount()).to.equal(3);
    });
  });

  describe("Security Tests (セキュリティテスト)", function () {
    it("オーナー権限の移転後は前オーナーに権限がない", async function () {
      // Arrange: Transfer ownership
      await marketFactory.transferOwnership(user1Address);
      
      // Act & Assert: Previous owner should not be able to create markets
      const validParams = {
        title: "Test Market",
        kpiDescription: "Test KPI",
        tradingDeadline: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        resolutionTime: Math.floor(Date.now() / 1000) + 8 * 24 * 60 * 60,
        numOutcomes: 3
      };

      await expect(marketFactory.createMarket(
        validParams.title,
        validParams.kpiDescription,
        validParams.tradingDeadline,
        validParams.resolutionTime,
        validParams.numOutcomes
      )).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});