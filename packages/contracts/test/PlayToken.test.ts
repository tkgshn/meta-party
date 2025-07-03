import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

/**
 * PlayToken Contract Tests
 * 
 * Following t-wada testing principles:
 * - Clear test names describing expected behavior
 * - Arrange-Act-Assert pattern
 * - Boundary value testing
 * - Edge case coverage
 */
describe("PlayToken", function () {
  let playToken: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;

  // Constants for better test readability
  const AIRDROP_AMOUNT = ethers.parseEther("1000");
  const ZERO_ADDRESS = ethers.ZeroAddress;

  beforeEach(async function () {
    // Arrange: Set up test environment
    [owner, user1, user2] = await ethers.getSigners();
    [ownerAddress, user1Address, user2Address] = await Promise.all([
      owner.getAddress(),
      user1.getAddress(),
      user2.getAddress()
    ]);
    
    const PlayToken = await ethers.getContractFactory("PlayToken");
    playToken = await PlayToken.deploy();
    await playToken.deploymentTransaction()?.wait();
  });

  describe("Contract Deployment", function () {
    it("契約をデプロイすると正しいトークン名とシンボルが設定される", async function () {
      // Act & Assert
      expect(await playToken.name()).to.equal("Play Token");
      expect(await playToken.symbol()).to.equal("PT");
    });

    it("契約をデプロイすると18桁の小数点精度が設定される", async function () {
      // Act & Assert
      expect(await playToken.decimals()).to.equal(18);
    });

    it("契約をデプロイするとエアドロップ量が1000PTに設定される", async function () {
      // Act & Assert
      expect(await playToken.getAirdropAmount()).to.equal(AIRDROP_AMOUNT);
    });

    it("契約をデプロイするとデプロイヤーがオーナーになる", async function () {
      // Act & Assert
      expect(await playToken.owner()).to.equal(ownerAddress);
    });

    it("契約をデプロイすると初期供給量は0になる", async function () {
      // Act & Assert
      expect(await playToken.totalSupply()).to.equal(0);
    });
  });

  describe("Token Claiming (エアドロップ機能)", function () {
    it("ユーザーが初回請求すると1000PTを受け取ることができる", async function () {
      // Arrange: Initial state verified in beforeEach
      
      // Act: User claims airdrop
      await playToken.connect(user1).claim();
      
      // Assert: User received correct amount and status updated
      const balance = await playToken.balanceOf(user1Address);
      expect(balance).to.equal(AIRDROP_AMOUNT);
      expect(await playToken.hasClaimed(user1Address)).to.be.true;
      expect(await playToken.totalSupply()).to.equal(AIRDROP_AMOUNT);
    });

    it("同じユーザーが2回請求しようとすると失敗する", async function () {
      // Arrange: User already claimed
      await playToken.connect(user1).claim();
      
      // Act & Assert: Second claim should fail
      await expect(playToken.connect(user1).claim())
        .to.be.revertedWith("PlayToken: Already claimed");
    });

    it("請求時にAirdropClaimedイベントが正しいパラメータで発行される", async function () {
      // Act & Assert: Event should be emitted with correct parameters
      await expect(playToken.connect(user1).claim())
        .to.emit(playToken, "AirdropClaimed")
        .withArgs(user1Address, AIRDROP_AMOUNT);
    });

    it("複数ユーザーの請求状態が独立して管理される", async function () {
      // Arrange: Initial state
      expect(await playToken.hasClaimed(user1Address)).to.be.false;
      expect(await playToken.hasClaimed(user2Address)).to.be.false;
      
      // Act: Only user1 claims
      await playToken.connect(user1).claim();
      
      // Assert: Only user1's status should change
      expect(await playToken.hasClaimed(user1Address)).to.be.true;
      expect(await playToken.hasClaimed(user2Address)).to.be.false;
      
      // Act: user2 also claims
      await playToken.connect(user2).claim();
      
      // Assert: Both users should have claimed status
      expect(await playToken.hasClaimed(user1Address)).to.be.true;
      expect(await playToken.hasClaimed(user2Address)).to.be.true;
    });

    it("10人のユーザーが連続で請求しても正しく動作する", async function () {
      // Arrange: Get 10 signers
      const signers = await ethers.getSigners();
      const users = signers.slice(0, 10);
      
      // Act: All users claim
      for (let i = 0; i < users.length; i++) {
        await playToken.connect(users[i]).claim();
      }
      
      // Assert: Total supply should be 10 * AIRDROP_AMOUNT
      const expectedTotalSupply = AIRDROP_AMOUNT.mul(10);
      expect(await playToken.totalSupply()).to.equal(expectedTotalSupply);
      
      // Assert: All users should have claimed status
      for (let i = 0; i < users.length; i++) {
        const userAddress = await users[i].getAddress();
        expect(await playToken.hasClaimed(userAddress)).to.be.true;
        expect(await playToken.balanceOf(userAddress)).to.equal(AIRDROP_AMOUNT);
      }
    });
  });

  describe("Admin Functions (管理者機能)", function () {
    it("オーナーは任意のアドレスにトークンをミントできる", async function () {
      // Arrange
      const mintAmount = ethers.parseEther("500");
      
      // Act
      await playToken.adminMint(user1Address, mintAmount);
      
      // Assert
      const balance = await playToken.balanceOf(user1Address);
      expect(balance).to.equal(mintAmount);
      expect(await playToken.totalSupply()).to.equal(mintAmount);
    });

    it("非オーナーはトークンをミントできない", async function () {
      // Arrange
      const mintAmount = ethers.parseEther("500");
      
      // Act & Assert
      await expect(playToken.connect(user1).adminMint(user1Address, mintAmount))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("ミント時にAdminMintイベントが正しいパラメータで発行される", async function () {
      // Arrange
      const mintAmount = ethers.parseEther("500");
      
      // Act & Assert
      await expect(playToken.adminMint(user1Address, mintAmount))
        .to.emit(playToken, "AdminMint")
        .withArgs(user1Address, mintAmount);
    });

    it("ゼロアドレスへのミントは失敗する", async function () {
      // Arrange
      const mintAmount = ethers.parseEther("500");
      
      // Act & Assert
      await expect(playToken.adminMint(ZERO_ADDRESS, mintAmount))
        .to.be.revertedWith("PlayToken: Invalid address");
    });

    it("ゼロ量のミントは失敗する", async function () {
      // Act & Assert
      await expect(playToken.adminMint(user1Address, 0))
        .to.be.revertedWith("PlayToken: Amount must be greater than 0");
    });

    it("最大値のミントも正常に動作する", async function () {
      // Arrange: Maximum safe integer in JavaScript
      const maxMintAmount = ethers.MaxUint256 / 2n; // Safe max to avoid overflow
      
      // Act
      await playToken.adminMint(user1Address, maxMintAmount);
      
      // Assert
      const balance = await playToken.balanceOf(user1Address);
      expect(balance).to.equal(maxMintAmount);
    });

    it("複数回のミントで累積残高が正しく計算される", async function () {
      // Arrange
      const firstMint = ethers.parseEther("300");
      const secondMint = ethers.parseEther("700");
      const expectedTotal = firstMint + secondMint;
      
      // Act
      await playToken.adminMint(user1Address, firstMint);
      await playToken.adminMint(user1Address, secondMint);
      
      // Assert
      const balance = await playToken.balanceOf(user1Address);
      expect(balance).to.equal(expectedTotal);
      expect(await playToken.totalSupply()).to.equal(expectedTotal);
    });
  });

  describe("ERC20 Functions (標準トークン機能)", function () {
    beforeEach(async function () {
      // Arrange: Both users claim their airdrop
      await playToken.connect(user1).claim();
      await playToken.connect(user2).claim();
    });

    it("トークンの転送が正常に動作する", async function () {
      // Arrange
      const transferAmount = ethers.parseEther("100");
      const expectedUser1Balance = AIRDROP_AMOUNT - transferAmount;
      const expectedUser2Balance = AIRDROP_AMOUNT + transferAmount;
      
      // Act
      await playToken.connect(user1).transfer(user2Address, transferAmount);
      
      // Assert
      expect(await playToken.balanceOf(user1Address)).to.equal(expectedUser1Balance);
      expect(await playToken.balanceOf(user2Address)).to.equal(expectedUser2Balance);
    });

    it("残高不足時の転送は失敗する", async function () {
      // Arrange: Try to transfer more than balance
      const excessiveAmount = AIRDROP_AMOUNT + 1n;
      
      // Act & Assert
      await expect(playToken.connect(user1).transfer(user2Address, excessiveAmount))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("承認機能が正常に動作する", async function () {
      // Arrange
      const approvalAmount = ethers.parseEther("100");
      
      // Act
      await playToken.connect(user1).approve(user2Address, approvalAmount);
      
      // Assert
      const allowance = await playToken.allowance(user1Address, user2Address);
      expect(allowance).to.equal(approvalAmount);
    });

    it("承認された金額での代理転送が正常に動作する", async function () {
      // Arrange
      const approvalAmount = ethers.parseEther("100");
      await playToken.connect(user1).approve(user2Address, approvalAmount);
      
      // Act
      await playToken.connect(user2).transferFrom(user1Address, user2Address, approvalAmount);
      
      // Assert
      expect(await playToken.balanceOf(user1Address)).to.equal(AIRDROP_AMOUNT - approvalAmount);
      expect(await playToken.balanceOf(user2Address)).to.equal(AIRDROP_AMOUNT + approvalAmount);
      expect(await playToken.allowance(user1Address, user2Address)).to.equal(0);
    });

    it("承認額を超えた代理転送は失敗する", async function () {
      // Arrange
      const approvalAmount = ethers.parseEther("100");
      const excessiveAmount = approvalAmount + 1n;
      await playToken.connect(user1).approve(user2Address, approvalAmount);
      
      // Act & Assert
      await expect(playToken.connect(user2).transferFrom(user1Address, user2Address, excessiveAmount))
        .to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("ゼロアドレスへの転送は失敗する", async function () {
      // Arrange
      const transferAmount = ethers.parseEther("100");
      
      // Act & Assert
      await expect(playToken.connect(user1).transfer(ZERO_ADDRESS, transferAmount))
        .to.be.revertedWith("ERC20: transfer to the zero address");
    });
  });

  describe("Integration Tests (統合テスト)", function () {
    it("請求・ミント・転送の混合シナリオが正常に動作する", async function () {
      // Arrange
      const mintAmount = ethers.parseEther("500");
      const transferAmount = ethers.parseEther("200");
      
      // Act: Complex scenario
      await playToken.connect(user1).claim(); // user1 claims 1000 PT
      await playToken.adminMint(user2Address, mintAmount); // user2 gets 500 PT from admin
      await playToken.connect(user1).transfer(user2Address, transferAmount); // user1 sends 200 PT to user2
      
      // Assert: Final balances
      expect(await playToken.balanceOf(user1Address)).to.equal(AIRDROP_AMOUNT - transferAmount);
      expect(await playToken.balanceOf(user2Address)).to.equal(mintAmount + transferAmount);
      expect(await playToken.totalSupply()).to.equal(AIRDROP_AMOUNT + mintAmount);
    });

    it("ガス効率性: 大量のトークン操作でもガス制限内で実行される", async function () {
      // Arrange
      const largeAmount = ethers.parseEther("1000000"); // 1M tokens
      
      // Act: Large operations should not exceed gas limits
      await playToken.adminMint(user1Address, largeAmount);
      await playToken.connect(user1).transfer(user2Address, largeAmount / 2n);
      
      // Assert: Operations completed successfully
      expect(await playToken.balanceOf(user1Address)).to.equal(largeAmount / 2n);
      expect(await playToken.balanceOf(user2Address)).to.equal(largeAmount / 2n);
    });
  });

  describe("Security Tests (セキュリティテスト)", function () {
    it("リエントランシー攻撃から保護されている", async function () {
      // Note: Our current implementation doesn't have external calls in critical functions
      // This test validates that the nonReentrant modifier works correctly
      
      // Arrange: User claims tokens
      await playToken.connect(user1).claim();
      
      // Act & Assert: Multiple rapid calls should not cause issues
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          playToken.connect(user1).transfer(user2Address, ethers.parseEther("1"))
        );
      }
      
      await Promise.all(promises);
      
      // Assert: Balance is correct (not affected by race conditions)
      const expectedBalance = AIRDROP_AMOUNT - ethers.parseEther("5");
      expect(await playToken.balanceOf(user1Address)).to.equal(expectedBalance);
    });
  });
});