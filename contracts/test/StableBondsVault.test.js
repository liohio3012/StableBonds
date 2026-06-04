import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("StableBondsVault Multi-Currency & StableFX Swaps", function () {
  let vault, usdc, eurc, cctpMessenger, stableFX;
  let owner, user, supplier;

  beforeEach(async function () {
    [owner, user, supplier] = await ethers.getSigners();

    // 1. Deploy Mock Tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("USD Coin", "USDC");
    await usdc.waitForDeployment();
    
    eurc = await MockERC20.deploy("Euro Coin", "EURC");
    await eurc.waitForDeployment();

    // 2. Deploy Mock Messenger
    const MockTokenMessenger = await ethers.getContractFactory("MockTokenMessenger");
    cctpMessenger = await MockTokenMessenger.deploy();
    await cctpMessenger.waitForDeployment();

    // 3. Deploy Mock StableFX
    const MockStableFX = await ethers.getContractFactory("MockStableFX");
    stableFX = await MockStableFX.deploy(await usdc.getAddress(), await eurc.getAddress());
    await stableFX.waitForDeployment();

    // 4. Deploy StableBondsVault
    const StableBondsVault = await ethers.getContractFactory("StableBondsVault");
    vault = await StableBondsVault.deploy(
      await usdc.getAddress(),
      await eurc.getAddress(),
      await cctpMessenger.getAddress(),
      await stableFX.getAddress()
    );
    await vault.waitForDeployment();

    // 5. Transfer tokens to MockStableFX and user
    await usdc.transfer(await stableFX.getAddress(), ethers.parseUnits("500000", 6));
    await eurc.transfer(await stableFX.getAddress(), ethers.parseUnits("500000", 6));

    await usdc.transfer(user.address, ethers.parseUnits("10000", 6));
    await eurc.transfer(user.address, ethers.parseUnits("10000", 6));
  });

  it("should deploy correctly with the right configuration", async function () {
    expect(await vault.usdc()).to.equal(await usdc.getAddress());
    expect(await vault.eurc()).to.equal(await eurc.getAddress());
    expect(await vault.cctpMessenger()).to.equal(await cctpMessenger.getAddress());
    expect(await vault.stableFX()).to.equal(await stableFX.getAddress());
  });

  describe("Swap-at-Deposit (EURC -> USDC locked)", function () {
    it("should swap EURC to USDC upon deposit, lock USDC, and settle in USDC", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      const minBuyAmount = ethers.parseUnits("1100", 6); // Rate is 1.10

      // Approve vault to spend EURC
      await eurc.connect(user).approve(await vault.getAddress(), depositAmount);

      // Create Bond (USDC termId 1 = 30 days)
      await vault.connect(user).createBondWithIntent(
        depositAmount,
        1, // termId = 30 days
        supplier.address,
        26, // destDomain
        await eurc.getAddress(), // deposit EURC
        await usdc.getAddress(), // settle USDC
        true, // swapAtDeposit = true
        minBuyAmount,
        "0x" // tradeData
      );

      const bond = await vault.bonds(1);
      expect(bond.owner).to.equal(user.address);
      expect(bond.principal).to.equal(minBuyAmount); // 1100 USDC locked
      expect(bond.depositToken).to.equal(await eurc.getAddress());
      expect(bond.settlementToken).to.equal(await usdc.getAddress());
      expect(bond.swapAtDeposit).to.be.true;

      // Check user yields are paid in USDC at maturity
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]); // fast forward 30 days
      await ethers.provider.send("evm_mine");

      const userBalanceBefore = await usdc.balanceOf(user.address);

      // Approve cctp messenger to spend USDC from vault (mock token transfer happens on burn)
      await vault.executeSettlement(1);

      const bondAfter = await vault.bonds(1);
      expect(bondAfter.isSettled).to.be.true;

      // Yield calculation: 1100 * 4% APY * 30 days / 365 = 3.61 USDC
      const userBalanceAfter = await usdc.balanceOf(user.address);
      expect(userBalanceAfter).to.be.gt(userBalanceBefore);
    });
  });

  describe("Swap-at-Maturity (EURC locked -> swap to USDC at maturity)", function () {
    it("should lock EURC and swap to USDC upon settlement at maturity", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      const minBuyAmount = ethers.parseUnits("1100", 6); // Rate is 1.10

      // Approve vault to spend EURC
      await eurc.connect(user).approve(await vault.getAddress(), depositAmount);

      // Create Bond (Swap-at-Maturity)
      await vault.connect(user).createBondWithIntent(
        depositAmount,
        1,
        supplier.address,
        26,
        await eurc.getAddress(),
        await usdc.getAddress(),
        false, // swapAtDeposit = false
        0,
        "0x"
      );

      const bond = await vault.bonds(1);
      expect(bond.principal).to.equal(depositAmount); // 1000 EURC locked
      expect(bond.swapAtDeposit).to.be.false;

      // Increase time to maturity
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Set up allowance of USDC inside mock messenger so vault can route USDC burn
      // Execute settlement with trade parameters
      const tx = await vault.executeSettlementWithTradeData(1, minBuyAmount, "0x");
      await tx.wait();

      const bondAfter = await vault.bonds(1);
      expect(bondAfter.isSettled).to.be.true;

      // Check messenger recorded the USDC burn
      expect(await cctpMessenger.amountChecked()).to.equal(minBuyAmount);
      expect(await cctpMessenger.burnTokenChecked()).to.equal(await usdc.getAddress());
    });
  });

  describe("Early Withdrawals", function () {
    it("should return EURC for early withdraw of swap-at-maturity bond", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);

      await eurc.connect(user).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user).createBondWithIntent(
        depositAmount,
        1,
        supplier.address,
        26,
        await eurc.getAddress(),
        await usdc.getAddress(),
        false, // swapAtMaturity
        0,
        "0x"
      );

      const balanceBefore = await eurc.balanceOf(user.address);
      await vault.connect(user).earlyWithdraw(1);

      const balanceAfter = await eurc.balanceOf(user.address);
      // penalty is 2% = 20 EURC. Refund is 980 EURC
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("980", 6));
    });

    it("should return USDC for early withdraw of swap-at-deposit bond", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      const minBuyAmount = ethers.parseUnits("1100", 6);

      await eurc.connect(user).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user).createBondWithIntent(
        depositAmount,
        1,
        supplier.address,
        26,
        await eurc.getAddress(),
        await usdc.getAddress(),
        true, // swapAtDeposit
        minBuyAmount,
        "0x"
      );

      const balanceBefore = await usdc.balanceOf(user.address);
      await vault.connect(user).earlyWithdraw(1);

      const balanceAfter = await usdc.balanceOf(user.address);
      // penalty is 2% on 1100 USDC = 22 USDC. Refund is 1078 USDC
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("1078", 6));
    });
  });

  describe("CCTP Cross-Chain Deposits (handleReceiveMessage)", function () {
    let mockTransmitter;

    beforeEach(async function () {
      const MockMessageTransmitter = await ethers.getContractFactory("MockMessageTransmitter");
      mockTransmitter = await MockMessageTransmitter.deploy();
      await mockTransmitter.waitForDeployment();

      // Configure transmitter on Vault
      await vault.connect(owner).setMessageTransmitter(await mockTransmitter.getAddress());
    });

    it("should reject handleReceiveMessage calls from unauthorized addresses", async function () {
      const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "address", "uint32", "address", "address", "bool", "uint256", "bytes"],
        [user.address, ethers.parseUnits("500", 6), 1, supplier.address, 26, await usdc.getAddress(), await usdc.getAddress(), false, 0, "0x"]
      );

      await expect(
        vault.connect(user).handleReceiveMessage(2, ethers.zeroPadValue(user.address, 32), payload)
      ).to.be.revertedWith("Only MessageTransmitter allowed");
    });

    it("should successfully mint a bond upon receiving a valid CCTP payload", async function () {
      const amount = ethers.parseUnits("500", 6);
      const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "address", "uint32", "address", "address", "bool", "uint256", "bytes"],
        [
          user.address,
          amount,
          1, // termId = 30 days
          supplier.address,
          26, // destDomain
          await usdc.getAddress(),
          await usdc.getAddress(),
          false,
          0,
          "0x"
        ]
      );

      // Simulate CCTP minting USDC to the vault contract beforehand
      await usdc.transfer(await vault.getAddress(), amount);

      // Trigger the mock transmitter delivery
      const senderBytes32 = ethers.zeroPadValue(user.address, 32);
      await mockTransmitter.receiveMessageWithPayload(
        await vault.getAddress(),
        2, // sourceDomain
        senderBytes32,
        payload
      );

      // Verify the bond was created on Arc
      const bondId = 1; // It should be the first bond in this block
      const bond = await vault.bonds(bondId);
      
      expect(bond.owner).to.equal(user.address);
      expect(bond.principal).to.equal(amount);
      expect(bond.termId).to.equal(1n);
      expect(bond.isSettled).to.be.false;
      expect(bond.intent.supplier).to.equal(supplier.address);
      expect(bond.intent.destDomain).to.equal(26);
    });
  });
});
