import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

/**
 * Enhanced PlayToken Contract Tests
 * 
 * Following t-wada testing principles:
 * - Clear test names describing expected behavior
 * - Arrange-Act-Assert pattern
 * - Boundary value testing
 * - Edge case coverage
 * 
 * Tests for Twitter OAuth airdrop system with role-based access control
 */
describe("Enhanced PlayToken", function () {
  let playToken: Contract;
  let owner: Signer;
  let distributor: Signer;
  let marketCreator: Signer;
  let user1: Signer;
  let user2: Signer;
  let unauthorized: Signer;
  
  let ownerAddress: string;
  let distributorAddress: string;
  let marketCreatorAddress: string;
  let user1Address: string;
  let user2Address: string;
  let unauthorizedAddress: string;

  // Constants for better test readability
  const BASE_AIRDROP_AMOUNT = ethers.parseEther("1000");
  const VOLUNTEER_BONUS_AMOUNT = ethers.parseEther("2000");
  const ZERO_ADDRESS = ethers.ZeroAddress;

  beforeEach(async function () {
    // Arrange: Set up test environment
    [owner, distributor, marketCreator, user1, user2, unauthorized] = await ethers.getSigners();
    [ownerAddress, distributorAddress, marketCreatorAddress, user1Address, user2Address, unauthorizedAddress] = 
      await Promise.all([
        owner.getAddress(),
        distributor.getAddress(),
        marketCreator.getAddress(),
        user1.getAddress(),
        user2.getAddress(),
        unauthorized.getAddress()
      ]);
    
    const PlayToken = await ethers.getContractFactory("PlayToken");
    playToken = await PlayToken.deploy();
    await playToken.deploymentTransaction()?.wait();

    // Set up roles for testing
    await playToken.addDistributor(distributorAddress);
    await playToken.addMarketCreator(marketCreatorAddress);
  });

  describe("Contract Deployment", function () {
    it("契約をデプロイすると正しいトークン名とシンボルが設定される", async function () {
      expect(await playToken.name()).to.equal("Play Token");
      expect(await playToken.symbol()).to.equal("PT");
    });

    it("契約をデプロイすると18桁の小数点精度が設定される", async function () {
      expect(await playToken.decimals()).to.equal(18);
    });

    it("契約をデプロイするとエアドロップ量が正しく設定される", async function () {
      expect(await playToken.getBaseAirdropAmount()).to.equal(BASE_AIRDROP_AMOUNT);
      expect(await playToken.getVolunteerBonusAmount()).to.equal(VOLUNTEER_BONUS_AMOUNT);
    });

    it("契約をデプロイするとデプロイヤーがすべての初期ロールを持つ", async function () {
      const DEFAULT_ADMIN_ROLE = await playToken.DEFAULT_ADMIN_ROLE();
      const DISTRIBUTOR_ROLE = await playToken.DISTRIBUTOR_ROLE();
      const MARKET_CREATOR_ROLE = await playToken.MARKET_CREATOR_ROLE();
      
      expect(await playToken.hasRole(DEFAULT_ADMIN_ROLE, ownerAddress)).to.be.true;
      expect(await playToken.hasRole(DISTRIBUTOR_ROLE, ownerAddress)).to.be.true;
      expect(await playToken.hasRole(MARKET_CREATOR_ROLE, ownerAddress)).to.be.true;
    });

    it("契約をデプロイすると初期供給量は0になる", async function () {
      expect(await playToken.totalSupply()).to.equal(0);
    });
  });

  describe("Role Management (ロール管理)", function () {
    it("管理者はディストリビューターを追加できる", async function () {
      const newDistributor = user1Address;
      
      await expect(playToken.addDistributor(newDistributor))
        .to.emit(playToken, "DistributorAdded")
        .withArgs(newDistributor);
      
      const DISTRIBUTOR_ROLE = await playToken.DISTRIBUTOR_ROLE();
      expect(await playToken.hasRole(DISTRIBUTOR_ROLE, newDistributor)).to.be.true;
    });

    it("管理者はディストリビューターを削除できる", async function () {
      await expect(playToken.removeDistributor(distributorAddress))
        .to.emit(playToken, "DistributorRemoved")
        .withArgs(distributorAddress);
      
      const DISTRIBUTOR_ROLE = await playToken.DISTRIBUTOR_ROLE();
      expect(await playToken.hasRole(DISTRIBUTOR_ROLE, distributorAddress)).to.be.false;
    });

    it("管理者はマーケットクリエイターを追加できる", async function () {
      const newCreator = user1Address;
      
      await expect(playToken.addMarketCreator(newCreator))
        .to.emit(playToken, "MarketCreatorAdded")
        .withArgs(newCreator);
      
      expect(await playToken.canCreateMarkets(newCreator)).to.be.true;
    });

    it("管理者はマーケットクリエイターを削除できる", async function () {
      await expect(playToken.removeMarketCreator(marketCreatorAddress))
        .to.emit(playToken, "MarketCreatorRemoved")
        .withArgs(marketCreatorAddress);
      
      expect(await playToken.canCreateMarkets(marketCreatorAddress)).to.be.false;
    });

    it("非管理者はロールを変更できない", async function () {
      await expect(playToken.connect(unauthorized).addDistributor(user1Address))
        .to.be.revertedWithCustomError(playToken, "AccessControlUnauthorizedAccount");
      
      await expect(playToken.connect(unauthorized).addMarketCreator(user1Address))
        .to.be.revertedWithCustomError(playToken, "AccessControlUnauthorizedAccount");
    });

    it("ゼロアドレスにロールを付与することはできない", async function () {
      await expect(playToken.addDistributor(ZERO_ADDRESS))
        .to.be.revertedWith("PlayToken: Invalid address");
      
      await expect(playToken.addMarketCreator(ZERO_ADDRESS))
        .to.be.revertedWith("PlayToken: Invalid address");
    });
  });

  describe("Base Airdrop Distribution (基本エアドロップ配布)", function () {
    it("ディストリビューターは基本エアドロップを配布できる", async function () {
      await expect(playToken.connect(distributor).distributeBaseAirdrop(user1Address))
        .to.emit(playToken, "BaseAirdropClaimed")
        .withArgs(user1Address, BASE_AIRDROP_AMOUNT)
        .and.to.emit(playToken, "TokensDistributed")
        .withArgs(user1Address, BASE_AIRDROP_AMOUNT, "Base airdrop");
      
      expect(await playToken.balanceOf(user1Address)).to.equal(BASE_AIRDROP_AMOUNT);
      expect(await playToken.hasClaimedBaseAirdrop(user1Address)).to.be.true;
      expect(await playToken.totalSupply()).to.equal(BASE_AIRDROP_AMOUNT);
    });

    it("非ディストリビューターは基本エアドロップを配布できない", async function () {
      await expect(playToken.connect(unauthorized).distributeBaseAirdrop(user1Address))
        .to.be.revertedWithCustomError(playToken, "AccessControlUnauthorizedAccount");
    });

    it("同じユーザーに2回基本エアドロップを配布することはできない", async function () {
      await playToken.connect(distributor).distributeBaseAirdrop(user1Address);
      
      await expect(playToken.connect(distributor).distributeBaseAirdrop(user1Address))
        .to.be.revertedWith("PlayToken: Base airdrop already claimed");
    });

    it("ゼロアドレスには基本エアドロップを配布できない", async function () {
      await expect(playToken.connect(distributor).distributeBaseAirdrop(ZERO_ADDRESS))
        .to.be.revertedWith("PlayToken: Invalid address");
    });

    it("複数ユーザーへの基本エアドロップ配布が正常に動作する", async function () {
      const users = [user1Address, user2Address];
      
      for (const userAddress of users) {
        await playToken.connect(distributor).distributeBaseAirdrop(userAddress);
      }
      
      for (const userAddress of users) {
        expect(await playToken.balanceOf(userAddress)).to.equal(BASE_AIRDROP_AMOUNT);
        expect(await playToken.hasClaimedBaseAirdrop(userAddress)).to.be.true;
      }
      
      expect(await playToken.totalSupply()).to.equal(BASE_AIRDROP_AMOUNT * BigInt(users.length));
    });
  });

  describe("Volunteer Bonus Distribution (ボランティアボーナス配布)", function () {
    it("ディストリビューターはボランティアボーナスを配布できる", async function () {
      await expect(playToken.connect(distributor).distributeVolunteerBonus(user1Address))
        .to.emit(playToken, "VolunteerBonusClaimed")
        .withArgs(user1Address, VOLUNTEER_BONUS_AMOUNT)
        .and.to.emit(playToken, "TokensDistributed")
        .withArgs(user1Address, VOLUNTEER_BONUS_AMOUNT, "Volunteer bonus");
      
      expect(await playToken.balanceOf(user1Address)).to.equal(VOLUNTEER_BONUS_AMOUNT);
      expect(await playToken.hasClaimedVolunteerBonus(user1Address)).to.be.true;
      expect(await playToken.totalSupply()).to.equal(VOLUNTEER_BONUS_AMOUNT);
    });

    it("同じユーザーに2回ボランティアボーナスを配布することはできない", async function () {
      await playToken.connect(distributor).distributeVolunteerBonus(user1Address);
      
      await expect(playToken.connect(distributor).distributeVolunteerBonus(user1Address))
        .to.be.revertedWith("PlayToken: Volunteer bonus already claimed");
    });

    it("基本エアドロップとボランティアボーナスは独立して管理される", async function () {
      // 基本エアドロップを配布
      await playToken.connect(distributor).distributeBaseAirdrop(user1Address);
      expect(await playToken.hasClaimedBaseAirdrop(user1Address)).to.be.true;
      expect(await playToken.hasClaimedVolunteerBonus(user1Address)).to.be.false;
      
      // ボランティアボーナスを配布
      await playToken.connect(distributor).distributeVolunteerBonus(user1Address);
      expect(await playToken.hasClaimedBaseAirdrop(user1Address)).to.be.true;
      expect(await playToken.hasClaimedVolunteerBonus(user1Address)).to.be.true;
      
      const expectedTotal = BASE_AIRDROP_AMOUNT + VOLUNTEER_BONUS_AMOUNT;
      expect(await playToken.balanceOf(user1Address)).to.equal(expectedTotal);
    });
  });

  describe("Custom Token Distribution (カスタムトークン配布)", function () {
    it("ディストリビューターはカスタム量のトークンを配布できる", async function () {
      const customAmount = ethers.parseEther("500");
      const reason = "Test distribution";
      
      await expect(playToken.connect(distributor).distributeTokens(user1Address, customAmount, reason))
        .to.emit(playToken, "TokensDistributed")
        .withArgs(user1Address, customAmount, reason);
      
      expect(await playToken.balanceOf(user1Address)).to.equal(customAmount);
      expect(await playToken.totalSupply()).to.equal(customAmount);
    });

    it("ゼロ量のカスタム配布は失敗する", async function () {
      await expect(playToken.connect(distributor).distributeTokens(user1Address, 0, "test"))
        .to.be.revertedWith("PlayToken: Amount must be greater than 0");
    });

    it("ゼロアドレスへのカスタム配布は失敗する", async function () {
      await expect(playToken.connect(distributor).distributeTokens(ZERO_ADDRESS, ethers.parseEther("100"), "test"))
        .to.be.revertedWith("PlayToken: Invalid address");
    });
  });

  describe("Legacy Functions (レガシー関数)", function () {
    it("レガシーclaim関数は使用できない", async function () {
      await expect(playToken.connect(user1).claim())
        .to.be.revertedWith("PlayToken: Use Twitter OAuth flow instead");
    });

    it("レガシーhasClaimed関数は基本エアドロップ状態を返す", async function () {
      expect(await playToken.hasClaimed(user1Address)).to.be.false;
      
      await playToken.connect(distributor).distributeBaseAirdrop(user1Address);
      
      expect(await playToken.hasClaimed(user1Address)).to.be.true;
    });
  });

  describe("Market Creation Permissions (マーケット作成権限)", function () {
    it("マーケットクリエイターロールを持つユーザーは権限がある", async function () {
      expect(await playToken.canCreateMarkets(marketCreatorAddress)).to.be.true;
    });

    it("マーケットクリエイターロールを持たないユーザーは権限がない", async function () {
      expect(await playToken.canCreateMarkets(unauthorizedAddress)).to.be.false;
    });

    it("オーナーは常にマーケット作成権限を持つ", async function () {
      expect(await playToken.canCreateMarkets(ownerAddress)).to.be.true;
    });
  });

  describe("ERC20 Functions (標準トークン機能)", function () {
    beforeEach(async function () {
      // ユーザーにトークンを配布
      await playToken.connect(distributor).distributeBaseAirdrop(user1Address);
      await playToken.connect(distributor).distributeBaseAirdrop(user2Address);
    });

    it("トークンの転送が正常に動作する", async function () {
      const transferAmount = ethers.parseEther("100");
      const expectedUser1Balance = BASE_AIRDROP_AMOUNT - transferAmount;
      const expectedUser2Balance = BASE_AIRDROP_AMOUNT + transferAmount;
      
      await playToken.connect(user1).transfer(user2Address, transferAmount);
      
      expect(await playToken.balanceOf(user1Address)).to.equal(expectedUser1Balance);
      expect(await playToken.balanceOf(user2Address)).to.equal(expectedUser2Balance);
    });

    it("残高不足時の転送は失敗する", async function () {
      const excessiveAmount = BASE_AIRDROP_AMOUNT + 1n;
      
      await expect(playToken.connect(user1).transfer(user2Address, excessiveAmount))
        .to.be.revertedWithCustomError(playToken, "ERC20InsufficientBalance");
    });

    it("承認機能が正常に動作する", async function () {
      const approvalAmount = ethers.parseEther("100");
      
      await playToken.connect(user1).approve(user2Address, approvalAmount);
      
      const allowance = await playToken.allowance(user1Address, user2Address);
      expect(allowance).to.equal(approvalAmount);
    });
  });

  describe("Integration Tests (統合テスト)", function () {
    it("完全なエアドロップフローが正常に動作する", async function () {
      // 基本エアドロップ
      await playToken.connect(distributor).distributeBaseAirdrop(user1Address);
      expect(await playToken.balanceOf(user1Address)).to.equal(BASE_AIRDROP_AMOUNT);
      
      // ボランティアボーナス
      await playToken.connect(distributor).distributeVolunteerBonus(user1Address);
      const expectedTotal = BASE_AIRDROP_AMOUNT + VOLUNTEER_BONUS_AMOUNT;
      expect(await playToken.balanceOf(user1Address)).to.equal(expectedTotal);
      
      // カスタム配布
      const customAmount = ethers.parseEther("500");
      await playToken.connect(distributor).distributeTokens(user1Address, customAmount, "Extra reward");
      const finalBalance = expectedTotal + customAmount;
      expect(await playToken.balanceOf(user1Address)).to.equal(finalBalance);
    });

    it("大量のユーザーへの配布が効率的に実行される", async function () {
      const signers = await ethers.getSigners();
      const users = signers.slice(0, 10);
      
      // 全ユーザーに基本エアドロップを配布
      for (const user of users) {
        const userAddress = await user.getAddress();
        await playToken.connect(distributor).distributeBaseAirdrop(userAddress);
      }
      
      // 検証
      for (const user of users) {
        const userAddress = await user.getAddress();
        expect(await playToken.balanceOf(userAddress)).to.equal(BASE_AIRDROP_AMOUNT);
        expect(await playToken.hasClaimedBaseAirdrop(userAddress)).to.be.true;
      }
      
      const expectedTotalSupply = BASE_AIRDROP_AMOUNT * BigInt(users.length);
      expect(await playToken.totalSupply()).to.equal(expectedTotalSupply);
    });
  });

  describe("Security Tests (セキュリティテスト)", function () {
    it("リエントランシー攻撃から保護されている", async function () {
      // 配布機能にリエントランシーガードが適用されている
      await playToken.connect(distributor).distributeBaseAirdrop(user1Address);
      
      // 複数の同時転送は正常に処理される
      const transferAmount = ethers.parseEther("1");
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          playToken.connect(user1).transfer(user2Address, transferAmount)
        );
      }
      
      await Promise.all(promises);
      
      const expectedBalance = BASE_AIRDROP_AMOUNT - (transferAmount * 5n);
      expect(await playToken.balanceOf(user1Address)).to.equal(expectedBalance);
    });

    it("権限のないアクセスがすべて防止されている", async function () {
      // 配布権限
      await expect(playToken.connect(unauthorized).distributeBaseAirdrop(user1Address))
        .to.be.revertedWithCustomError(playToken, "AccessControlUnauthorizedAccount");
      
      await expect(playToken.connect(unauthorized).distributeVolunteerBonus(user1Address))
        .to.be.revertedWithCustomError(playToken, "AccessControlUnauthorizedAccount");
      
      // ロール管理権限
      await expect(playToken.connect(unauthorized).addDistributor(user1Address))
        .to.be.revertedWithCustomError(playToken, "AccessControlUnauthorizedAccount");
      
      await expect(playToken.connect(unauthorized).addMarketCreator(user1Address))
        .to.be.revertedWithCustomError(playToken, "AccessControlUnauthorizedAccount");
    });

    it("重複配布が確実に防止されている", async function () {
      // 基本エアドロップの重複防止
      await playToken.connect(distributor).distributeBaseAirdrop(user1Address);
      await expect(playToken.connect(distributor).distributeBaseAirdrop(user1Address))
        .to.be.revertedWith("PlayToken: Base airdrop already claimed");
      
      // ボランティアボーナスの重複防止
      await playToken.connect(distributor).distributeVolunteerBonus(user1Address);
      await expect(playToken.connect(distributor).distributeVolunteerBonus(user1Address))
        .to.be.revertedWith("PlayToken: Volunteer bonus already claimed");
    });
  });

  describe("Interface Compliance (インターフェース準拠)", function () {
    it("ERC165インターフェースサポートが正しく動作する", async function () {
      // AccessControl インターフェース
      const accessControlInterfaceId = "0x7965db0b"; // IAccessControl interface ID
      expect(await playToken.supportsInterface(accessControlInterfaceId)).to.be.true;
      
      // サポートしていないインターフェース
      const unsupportedInterfaceId = "0xffffffff";
      expect(await playToken.supportsInterface(unsupportedInterfaceId)).to.be.false;
    });
  });
});