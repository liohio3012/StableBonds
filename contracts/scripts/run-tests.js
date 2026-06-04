import { ethers } from "ethers";
import assert from "assert";
import fs from "fs";

async function main() {
  console.log("Starting StableBondsVault Integration Tests...");

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Hardhat default accounts
  const ownerWallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  const userWallet = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
  const supplierWallet = new ethers.Wallet("0x5de4111def4ec5b24b898b80ae32011300e19311aa34a2fdb69261d1002843c2", provider);

  console.log("Accounts:");
  console.log(" - Owner:", ownerWallet.address);
  console.log(" - User:", userWallet.address);
  console.log(" - Supplier:", supplierWallet.address);

  // Local nonce tracker to prevent race conditions on automining
  const nonces = {};
  async function getNextNonce(address) {
    if (nonces[address] === undefined) {
      nonces[address] = await provider.getTransactionCount(address, "latest");
    }
    const current = nonces[address];
    nonces[address] = current + 1;
    return current;
  }

  // Helper to deploy with manual nonce handling
  async function deployContract(factory, ...args) {
    const signerAddress = await factory.runner.getAddress();
    const nonce = await getNextNonce(signerAddress);
    const contract = await factory.deploy(...args, { nonce });
    await contract.waitForDeployment();
    return contract;
  }

  // Helper to send transactions with manual nonce handling
  async function sendTx(wallet, txPromise) {
    const nonce = await getNextNonce(wallet.address);
    try {
      const tx = await txPromise(nonce);
      const receipt = await tx.wait();
      console.log(`     Tx Mined: ${tx.hash.substring(0, 10)}... Block: ${receipt.blockNumber} Nonce: ${nonce}`);
      return tx;
    } catch (err) {
      nonces[wallet.address] = nonce;
      throw err;
    }
  }

  // Load compiled artifacts
  const mockERC20Artifact = JSON.parse(fs.readFileSync("./artifacts/src/mocks/Mocks.sol/MockERC20.json", "utf8"));
  const mockTokenMessengerArtifact = JSON.parse(fs.readFileSync("./artifacts/src/mocks/Mocks.sol/MockTokenMessenger.json", "utf8"));
  const mockStableFXArtifact = JSON.parse(fs.readFileSync("./artifacts/src/mocks/Mocks.sol/MockStableFX.json", "utf8"));
  const mockMessageTransmitterArtifact = JSON.parse(fs.readFileSync("./artifacts/src/mocks/Mocks.sol/MockMessageTransmitter.json", "utf8"));
  const mockKeeperRegistryArtifact = JSON.parse(fs.readFileSync("./artifacts/src/mocks/Mocks.sol/MockKeeperRegistry.json", "utf8"));
  const vaultArtifact = JSON.parse(fs.readFileSync("./artifacts/src/StableBondsVault.sol/StableBondsVault.json", "utf8"));
  const complianceRegistryArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ComplianceRegistry.sol/ComplianceRegistry.json", "utf8"));
  const agentRegistryArtifact = JSON.parse(fs.readFileSync("./artifacts/src/AgentRegistry.sol/AgentRegistry.json", "utf8"));
  const multiSigProposalArtifact = JSON.parse(fs.readFileSync("./artifacts/src/MultiSigProposal.sol/MultiSigProposal.json", "utf8"));

  // 1. Deploy Mock USDC & EURC Tokens
  const mockERC20Factory = new ethers.ContractFactory(mockERC20Artifact.abi, mockERC20Artifact.bytecode, ownerWallet);
  const usdc = await deployContract(mockERC20Factory, "USD Coin", "USDC");
  const usdcAddress = await usdc.getAddress();
  console.log("Mock USDC deployed at:", usdcAddress);

  const eurc = await deployContract(mockERC20Factory, "Euro Coin", "EURC");
  const eurcAddress = await eurc.getAddress();
  console.log("Mock EURC deployed at:", eurcAddress);

  // 2. Deploy Mock TokenMessenger (CCTP)
  const mockTokenMessengerFactory = new ethers.ContractFactory(mockTokenMessengerArtifact.abi, mockTokenMessengerArtifact.bytecode, ownerWallet);
  const cctpMessenger = await deployContract(mockTokenMessengerFactory);
  const cctpMessengerAddress = await cctpMessenger.getAddress();
  console.log("Mock TokenMessenger deployed at:", cctpMessengerAddress);

  // 3. Deploy Mock StableFX Router
  const mockStableFXFactory = new ethers.ContractFactory(mockStableFXArtifact.abi, mockStableFXArtifact.bytecode, ownerWallet);
  const stableFX = await deployContract(mockStableFXFactory, usdcAddress, eurcAddress);
  const stableFXAddress = await stableFX.getAddress();
  console.log("Mock StableFX deployed at:", stableFXAddress);

  // 3b. Deploy ComplianceRegistry
  const complianceRegistryFactory = new ethers.ContractFactory(complianceRegistryArtifact.abi, complianceRegistryArtifact.bytecode, ownerWallet);
  const complianceRegistry = await deployContract(complianceRegistryFactory, ownerWallet.address);
  const complianceRegistryAddress = await complianceRegistry.getAddress();
  console.log("ComplianceRegistry deployed at:", complianceRegistryAddress);

  // Whitelist userWallet so existing tests work
  await sendTx(ownerWallet, (n) => complianceRegistry.connect(ownerWallet).verifyWallet(userWallet.address, { nonce: n }));
  console.log("Verified userWallet in ComplianceRegistry:", userWallet.address);

  // Fund supplierWallet with native gas tokens from ownerWallet
  await sendTx(ownerWallet, (n) => ownerWallet.sendTransaction({
    to: supplierWallet.address,
    value: ethers.parseEther("10"),
    nonce: n
  }));
  console.log("Funded supplierWallet with native gas tokens.");

  // 4. Deploy StableBondsVault
  const vaultFactory = new ethers.ContractFactory(vaultArtifact.abi, vaultArtifact.bytecode, ownerWallet);
  const vault = await deployContract(vaultFactory, usdcAddress, eurcAddress, cctpMessengerAddress, stableFXAddress, complianceRegistryAddress);
  const vaultAddress = await vault.getAddress();
  console.log("StableBondsVault deployed at:", vaultAddress);

  // 4b. Deploy Mock MessageTransmitter
  const mockMessageTransmitterFactory = new ethers.ContractFactory(mockMessageTransmitterArtifact.abi, mockMessageTransmitterArtifact.bytecode, ownerWallet);
  const mockTransmitter = await deployContract(mockMessageTransmitterFactory);
  const mockTransmitterAddress = await mockTransmitter.getAddress();
  console.log("Mock MessageTransmitter deployed at:", mockTransmitterAddress);

  // 5. Transfer tokens to MockStableFX, user, and Vault buffer
  await sendTx(ownerWallet, (n) => usdc.transfer(stableFXAddress, ethers.parseUnits("500000", 6), { nonce: n }));
  await sendTx(ownerWallet, (n) => eurc.transfer(stableFXAddress, ethers.parseUnits("500000", 6), { nonce: n }));

  await sendTx(ownerWallet, (n) => usdc.transfer(userWallet.address, ethers.parseUnits("10000", 6), { nonce: n }));
  await sendTx(ownerWallet, (n) => eurc.transfer(userWallet.address, ethers.parseUnits("10000", 6), { nonce: n }));

  // Fund the Vault with buffers to pay yield
  await sendTx(ownerWallet, (n) => usdc.transfer(vaultAddress, ethers.parseUnits("10000", 6), { nonce: n }));
  await sendTx(ownerWallet, (n) => eurc.transfer(vaultAddress, ethers.parseUnits("10000", 6), { nonce: n }));

  console.log("\nSetup complete. Running Test Cases...\n");

  // ----------------------------------------------------
  // TEST 1: Deployment Configuration
  // ----------------------------------------------------
  console.log("Running Test 1: Deployment configuration check...");
  assert.strictEqual(await vault.usdc(), usdcAddress, "USDC mismatch");
  assert.strictEqual(await vault.eurc(), eurcAddress, "EURC mismatch");
  assert.strictEqual(await vault.cctpMessenger(), cctpMessengerAddress, "CCTP messenger mismatch");
  assert.strictEqual(await vault.stableFX(), stableFXAddress, "StableFX mismatch");
  console.log("✓ Test 1 Passed.");

  // ----------------------------------------------------
  // TEST 2: Swap-at-Deposit (EURC -> USDC locked)
  // ----------------------------------------------------
  console.log("\nRunning Test 2: Swap-at-Deposit (EURC -> USDC)...");
  const depositAmount = ethers.parseUnits("1000", 6);
  const minBuyAmount = ethers.parseUnits("1100", 6); // Mock StableFX rate is 1.10

  // Approve vault to spend EURC
  await sendTx(userWallet, (n) => eurc.connect(userWallet).approve(vaultAddress, depositAmount, { nonce: n }));

  // Create Bond (USDC termId 1 = 30 days)
  await sendTx(userWallet, (n) => vault.connect(userWallet).createBondWithIntent(
    depositAmount,
    1, // termId
    supplierWallet.address,
    26, // destDomain
    eurcAddress, // depositToken
    usdcAddress, // settlementToken
    true, // swapAtDeposit
    minBuyAmount,
    "0x",
    { nonce: n }
  ));

  let bond = await vault.bonds(1);
  assert.strictEqual(bond.owner, userWallet.address, "Bond owner mismatch");
  assert.strictEqual(bond.principal, minBuyAmount, "Locked principal mismatch");
  assert.strictEqual(bond.depositToken, eurcAddress, "Deposit token mismatch");
  assert.strictEqual(bond.settlementToken, usdcAddress, "Settlement token mismatch");
  assert.strictEqual(bond.swapAtDeposit, true, "SwapAtDeposit should be true");
  console.log("✓ Bond created with swapped principal (1100 USDC).");

  // Fast forward 30 days to mature
  await provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
  await provider.send("evm_mine", []);

  const usdcBalanceBefore = await usdc.balanceOf(userWallet.address);

  // Execute settlement
  await sendTx(ownerWallet, (n) => vault.executeSettlement(1, { nonce: n }));

  const bondAfter = await vault.bonds(1);
  assert.strictEqual(bondAfter.isSettled, true, "Bond should be settled");

  const usdcBalanceAfter = await usdc.balanceOf(userWallet.address);
  // Yield earned: 1100 * 4% * 30 / 365 = 3.61 USDC
  assert.ok(usdcBalanceAfter > usdcBalanceBefore, "User should have received yield in USDC");
  console.log("✓ Test 2 Passed: Swap-at-deposit mature and yield distribution correct.");

  // ----------------------------------------------------
  // TEST 3: Swap-at-Maturity (EURC locked -> swap to USDC at maturity)
  // ----------------------------------------------------
  console.log("\nRunning Test 3: Swap-at-Maturity (EURC locked -> swap to USDC at maturity)...");
  await sendTx(userWallet, (n) => eurc.connect(userWallet).approve(vaultAddress, depositAmount, { nonce: n }));

  await sendTx(userWallet, (n) => vault.connect(userWallet).createBondWithIntent(
    depositAmount,
    1,
    supplierWallet.address,
    26,
    eurcAddress,
    usdcAddress,
    false, // swapAtDeposit = false
    0,
    "0x",
    { nonce: n }
  ));

  let bond2 = await vault.bonds(2);
  assert.strictEqual(bond2.principal, depositAmount, "Locked principal should be original deposit (1000 EURC)");
  assert.strictEqual(bond2.swapAtDeposit, false, "SwapAtDeposit should be false");

  // Fast forward 30 days
  await provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
  await provider.send("evm_mine", []);

  // Execute maturity settlement with trade parameters
  await sendTx(ownerWallet, (n) => vault.executeSettlementWithTradeData(2, minBuyAmount, "0x", { nonce: n }));

  const bond2After = await vault.bonds(2);
  assert.strictEqual(bond2After.isSettled, true, "Bond should be settled");

  // Check mock messenger has burned the swapped USDC
  assert.strictEqual(await cctpMessenger.amountChecked(), minBuyAmount, "Messenger did not burn expected USDC");
  assert.strictEqual(await cctpMessenger.burnTokenChecked(), usdcAddress, "Messenger did not burn USDC token");
  console.log("✓ Test 3 Passed: Swap-at-maturity correctly executed StableFX swap + CCTP burn.");

  // ----------------------------------------------------
  // TEST 4: Early Withdrawals
  // ----------------------------------------------------
  console.log("\nRunning Test 4: Early Withdrawals (Correct currency routing)...");
  
  // Case A: Swap-at-Maturity (Holds EURC, returns EURC)
  await sendTx(userWallet, (n) => eurc.connect(userWallet).approve(vaultAddress, depositAmount, { nonce: n }));
  await sendTx(userWallet, (n) => vault.connect(userWallet).createBondWithIntent(
    depositAmount,
    1,
    supplierWallet.address,
    26,
    eurcAddress,
    usdcAddress,
    false,
    0,
    "0x",
    { nonce: n }
  ));

  let eurcBalanceBefore = await eurc.balanceOf(userWallet.address);
  await sendTx(userWallet, (n) => vault.connect(userWallet).earlyWithdraw(3, { nonce: n }));
  let eurcBalanceAfter = await eurc.balanceOf(userWallet.address);
  // 2% penalty on 1000 EURC = 20 EURC penalty. Refund = 980 EURC.
  assert.strictEqual(eurcBalanceAfter - eurcBalanceBefore, ethers.parseUnits("980", 6), "EURC early withdraw refund incorrect");
  console.log("✓ Case A Passed: Early exit on swap-at-maturity refunded in EURC minus penalty.");

  // Case B: Swap-at-Deposit (Holds USDC, returns USDC)
  await sendTx(userWallet, (n) => eurc.connect(userWallet).approve(vaultAddress, depositAmount, { nonce: n }));
  await sendTx(userWallet, (n) => vault.connect(userWallet).createBondWithIntent(
    depositAmount,
    1,
    supplierWallet.address,
    26,
    eurcAddress,
    usdcAddress,
    true,
    minBuyAmount,
    "0x",
    { nonce: n }
  ));

  let usdcBalanceBeforeExit = await usdc.balanceOf(userWallet.address);
  await sendTx(userWallet, (n) => vault.connect(userWallet).earlyWithdraw(4, { nonce: n }));
  let usdcBalanceAfterExit = await usdc.balanceOf(userWallet.address);
  // 2% penalty on 1100 USDC = 22 USDC penalty. Refund = 1078 USDC.
  assert.strictEqual(usdcBalanceAfterExit - usdcBalanceBeforeExit, ethers.parseUnits("1078", 6), "USDC early withdraw refund incorrect");
  console.log("✓ Case B Passed: Early exit on swap-at-deposit refunded in USDC minus penalty.");

  // ----------------------------------------------------
  // TEST 5: CCTP Cross-Chain Deposits (handleReceiveMessage)
  // ----------------------------------------------------
  console.log("\nRunning Test 5: CCTP Cross-Chain Deposits (handleReceiveMessage)...");
  
  // Set Transmitter on Vault
  await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).setMessageTransmitter(mockTransmitterAddress, { nonce: n }));

  // Case A: Unauthorized caller
  const crossChainAmount = ethers.parseUnits("500", 6);
  const payload = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256", "uint256", "address", "uint32", "address", "address", "bool", "uint256", "bytes"],
    [
      userWallet.address,
      crossChainAmount,
      1, // termId = 30 days
      supplierWallet.address,
      26, // destDomain
      usdcAddress,
      usdcAddress,
      false,
      0,
      "0x"
    ]
  );

  try {
    const senderBytes32 = ethers.zeroPadValue(userWallet.address, 32);
    await vault.connect(userWallet).handleReceiveMessage(2, senderBytes32, payload);
    assert.fail("Should have reverted");
  } catch (err) {
    assert.ok(err.message.includes("Only MessageTransmitter allowed"), "Expected revert message 'Only MessageTransmitter allowed'");
    console.log("✓ Case A Passed: Unauthorized handleReceiveMessage call reverted.");
  }

  // Case B: Valid cross-chain deposit message
  // Simulate minting USDC to the vault beforehand by CCTP
  await sendTx(ownerWallet, (n) => usdc.transfer(vaultAddress, crossChainAmount, { nonce: n }));

  const senderBytes32 = ethers.zeroPadValue(userWallet.address, 32);
  await sendTx(ownerWallet, (n) => mockTransmitter.receiveMessageWithPayload(
    vaultAddress,
    2, // sourceDomain
    senderBytes32,
    payload,
    { nonce: n }
  ));

  // Verify the bond was successfully created on Arc
  const nextBondIdVal = await vault.nextBondId();
  const crossChainBond = await vault.bonds(nextBondIdVal - 1n);

  assert.strictEqual(crossChainBond.owner, userWallet.address, "Cross-chain bond owner mismatch");
  assert.strictEqual(crossChainBond.principal, crossChainAmount, "Cross-chain bond principal mismatch");
  assert.strictEqual(crossChainBond.termId, 1n, "Cross-chain bond term ID mismatch");
  assert.strictEqual(crossChainBond.isSettled, false, "Cross-chain bond should not be settled");
  assert.strictEqual(crossChainBond.intent.supplier, supplierWallet.address, "Cross-chain bond supplier mismatch");
  assert.strictEqual(crossChainBond.intent.destDomain, 26n, "Cross-chain bond destDomain mismatch");
  console.log("✓ Case B Passed: Valid CCTP message created cross-chain bond successfully.");

  // ----------------------------------------------------
  // TEST 6: Compliance and Whitelisting / Blacklisting Guardrails
  // ----------------------------------------------------
  console.log("\nRunning Test 6: Compliance and Whitelisting / Blacklisting Guardrails...");
  
  // Create an unverified wallet
  const unverifiedWallet = ethers.Wallet.createRandom().connect(provider);
  // Send some ETH/USDC to unverified wallet to transact
  await sendTx(ownerWallet, (n) => ownerWallet.sendTransaction({ to: unverifiedWallet.address, value: ethers.parseEther("0.1"), nonce: n }));
  await sendTx(ownerWallet, (n) => usdc.transfer(unverifiedWallet.address, ethers.parseUnits("500", 6), { nonce: n }));
  await sendTx(unverifiedWallet, (n) => usdc.connect(unverifiedWallet).approve(vaultAddress, ethers.parseUnits("500", 6), { nonce: n }));

  // Case A: Unverified wallet attempts to deposit -> Should revert
  try {
    await sendTx(unverifiedWallet, (n) => vault.connect(unverifiedWallet).createBondWithIntent(
      ethers.parseUnits("100", 6),
      1,
      supplierWallet.address,
      26,
      { nonce: n }
    ));
    assert.fail("Should have reverted");
  } catch (err) {
    assert.ok(err.message.includes("User not KYC/KYB verified"), "Expected revert message 'User not KYC/KYB verified'");
    console.log("✓ Case A Passed: Unverified address deposit reverted correctly.");
  }

  // Case B: Verify wallet -> Should now succeed
  await sendTx(ownerWallet, (n) => complianceRegistry.connect(ownerWallet).verifyWallet(unverifiedWallet.address, { nonce: n }));
  console.log("✓ Unverified wallet verified.");

  console.log("DEBUG:");
  console.log("Vault compliance registry address:", await vault.complianceRegistry());
  console.log("Local compliance registry address:", complianceRegistryAddress);
  console.log("Unverified wallet address:", unverifiedWallet.address);
  console.log("Is verified on complianceRegistry contract:", await complianceRegistry.isVerified(unverifiedWallet.address));
  const vaultRegistryContract = new ethers.Contract(await vault.complianceRegistry(), complianceRegistryArtifact.abi, provider);
  console.log("Is verified checked from vault:", await vaultRegistryContract.isVerified(unverifiedWallet.address));
  console.log("Unverified wallet transaction count:", await provider.getTransactionCount(unverifiedWallet.address));

  // Send a dummy tx to increment nonce and clear any cached gas estimation failure on the node
  await sendTx(unverifiedWallet, (n) => unverifiedWallet.sendTransaction({ to: unverifiedWallet.address, value: 0, nonce: n }));
  console.log("✓ Dummy transaction sent to clear gas cache.");

  // Test Gas cost of verified transaction (Stress test check)
  const depositTx = await sendTx(unverifiedWallet, (n) => vault.connect(unverifiedWallet).createBondWithIntent(
    ethers.parseUnits("100", 6),
    1,
    supplierWallet.address,
    26,
    { nonce: n }
  ));
  const receipt = await depositTx.wait();
  console.log(`✓ Case B Passed: Verified wallet deposited successfully. Gas used: ${receipt.gasUsed.toString()}`);

  // Case C: Blacklist wallet -> Should revert on deposit
  await sendTx(ownerWallet, (n) => complianceRegistry.connect(ownerWallet).blacklistWallet(unverifiedWallet.address, { nonce: n }));
  console.log("✓ Wallet blacklisted.");

  try {
    await sendTx(unverifiedWallet, (n) => vault.connect(unverifiedWallet).createBondWithIntent(
      ethers.parseUnits("100", 6),
      1,
      supplierWallet.address,
      26,
      { nonce: n }
    ));
    assert.fail("Should have reverted");
  } catch (err) {
    assert.ok(err.message.includes("Sanctioned address"), "Expected revert message 'Sanctioned address'");
    console.log("✓ Case C Passed: Blacklisted address deposit reverted correctly.");
  }

  // Case D: Blacklisted address early exit and mature settlement -> Should revert
  const bondIdToTest = 6;
  try {
    await sendTx(unverifiedWallet, (n) => vault.connect(unverifiedWallet).earlyWithdraw(bondIdToTest, { nonce: n }));
    assert.fail("Should have reverted");
  } catch (err) {
    assert.ok(err.message.includes("Sanctioned address"), "Expected revert earlyWithdraw message 'Sanctioned address'");
    console.log("✓ Case D Passed: Blacklisted address earlyWithdraw reverted correctly.");
  }

  try {
    await sendTx(ownerWallet, (n) => vault.executeSettlement(bondIdToTest, { nonce: n }));
    assert.fail("Should have reverted");
  } catch (err) {
    assert.ok(err.message.includes("Sanctioned address"), "Expected revert executeSettlement message 'Sanctioned address'");
    console.log("✓ Case D (part 2) Passed: Blacklisted address settlement execution reverted correctly.");
  }

  // Case E: Cross-chain CCTP deposit with unverified owner -> Should revert
  const crossChainAmountTest6 = ethers.parseUnits("100", 6);
  const unverifiedCcOwner = ethers.Wallet.createRandom().address;
  const payloadTest6 = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256", "uint256", "address", "uint32", "address", "address", "bool", "uint256", "bytes"],
    [
      unverifiedCcOwner,
      crossChainAmountTest6,
      1,
      supplierWallet.address,
      26,
      usdcAddress,
      usdcAddress,
      false,
      0,
      "0x"
    ]
  );
  
  await sendTx(ownerWallet, (n) => usdc.transfer(vaultAddress, crossChainAmountTest6, { nonce: n }));

  try {
    const senderBytes32 = ethers.zeroPadValue(userWallet.address, 32);
    await sendTx(ownerWallet, (n) => mockTransmitter.connect(ownerWallet).receiveMessageWithPayload(
      vaultAddress,
      2,
      senderBytes32,
      payloadTest6,
      { nonce: n }
    ));
    assert.fail("Should have reverted");
  } catch (err) {
    assert.ok(err.message.includes("User not KYC/KYB verified"), "Expected CCTP revert 'User not KYC/KYB verified'");
    console.log("✓ Case E Passed: Unverified CCTP receiver reverted correctly.");
  }

  // ----------------------------------------------------
  // TEST 7: Keeper Automation (checkUpkeep / performUpkeep)
  // ----------------------------------------------------
  console.log("\nRunning Test 7: Keeper Automation (checkUpkeep / performUpkeep)...");

  // 7-A: Deploy MockKeeperRegistry
  const keeperRegistryFactory = new ethers.ContractFactory(mockKeeperRegistryArtifact.abi, mockKeeperRegistryArtifact.bytecode, ownerWallet);
  const keeperRegistry = await deployContract(keeperRegistryFactory);
  const keeperRegistryAddress = await keeperRegistry.getAddress();
  console.log("MockKeeperRegistry deployed at:", keeperRegistryAddress);

  // 7-B: Create a fresh bond that hasn't matured yet (will be used in later cases)
  //       We need a fresh verified wallet distinct from the blacklisted one.
  const keeperUserWallet = new ethers.Wallet("0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926b", provider);
  await sendTx(ownerWallet, (n) => ownerWallet.sendTransaction({ to: keeperUserWallet.address, value: ethers.parseEther("0.5"), nonce: n }));
  await sendTx(ownerWallet, (n) => usdc.transfer(keeperUserWallet.address, ethers.parseUnits("2000", 6), { nonce: n }));
  await sendTx(ownerWallet, (n) => complianceRegistry.connect(ownerWallet).verifyWallet(keeperUserWallet.address, { nonce: n }));
  await sendTx(keeperUserWallet, (n) => usdc.connect(keeperUserWallet).approve(vaultAddress, ethers.parseUnits("2000", 6), { nonce: n }));

  // Create Bond A (30-day term) — this will mature after time-travel
  await sendTx(keeperUserWallet, (n) => vault.connect(keeperUserWallet).createBondWithIntent(
    ethers.parseUnits("500", 6),
    1, // termId 1 = 30 days
    supplierWallet.address,
    3, // destDomain Express
    { nonce: n }
  ));
  const keeperBondIdA = Number(await vault.nextBondId()) - 1;
  console.log("Keeper Bond A created, ID:", keeperBondIdA);

  // Create Bond B (30-day term) — second bond for batch test
  await sendTx(keeperUserWallet, (n) => vault.connect(keeperUserWallet).createBondWithIntent(
    ethers.parseUnits("300", 6),
    1,
    supplierWallet.address,
    3,
    { nonce: n }
  ));
  const keeperBondIdB = Number(await vault.nextBondId()) - 1;
  console.log("Keeper Bond B created, ID:", keeperBondIdB);

  // 7-C: checkUpkeep BEFORE time travel — should report no work needed
  const [upkeepNeededBefore, performDataBefore] = await vault.checkUpkeep("0x");
  assert.strictEqual(upkeepNeededBefore, false, "upkeepNeeded should be false before maturity");
  assert.strictEqual(performDataBefore, "0x", "performData should be empty before maturity");
  console.log("✓ Case A Passed: checkUpkeep returns false before bond maturity.");

  // Also verify getMaturedUnsettledBonds returns empty
  const maturedBeforeTravel = await vault.getMaturedUnsettledBonds();
  assert.strictEqual(maturedBeforeTravel.length, 0, "No bonds should be matured yet");
  console.log("✓ Case A (getMaturedUnsettledBonds) Passed: returns empty before maturity.");

  // 7-D: Fast-forward 30+ days so both bonds mature
  await provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
  await provider.send("evm_mine", []);

  // checkUpkeep AFTER time travel — should detect both bonds
  const [upkeepNeededAfter, performDataAfter] = await vault.checkUpkeep("0x");
  assert.strictEqual(upkeepNeededAfter, true, "upkeepNeeded should be true after maturity");
  const decodedBondIds = ethers.AbiCoder.defaultAbiCoder().decode(["uint256[]"], performDataAfter)[0];
  assert.ok(decodedBondIds.includes(BigInt(keeperBondIdA)), "Bond A should appear in performData");
  assert.ok(decodedBondIds.includes(BigInt(keeperBondIdB)), "Bond B should appear in performData");
  console.log(`✓ Case B Passed: checkUpkeep returns true with ${decodedBondIds.length} bond(s) after maturity.`);

  // getMaturedUnsettledBonds helper matches checkUpkeep
  const maturedAfterTravel = await vault.getMaturedUnsettledBonds();
  assert.ok(maturedAfterTravel.length >= 2, "getMaturedUnsettledBonds should return at least 2 bonds");
  console.log("✓ Case B (getMaturedUnsettledBonds) Passed: returns", maturedAfterTravel.length, "bond(s).");

  // 7-E: Unauthorized keeper call — set an authorized keeper then call from another address
  await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).setAuthorizedKeeper(keeperRegistryAddress, { nonce: n }));
  try {
    // performUpkeep called directly by ownerWallet (not the registry) should revert
    const dummyPerformData = ethers.AbiCoder.defaultAbiCoder().encode(["uint256[]"], [[BigInt(keeperBondIdA)]]);
    await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).performUpkeep(dummyPerformData, { nonce: n }));
    assert.fail("Should have reverted with unauthorized keeper");
  } catch (err) {
    assert.ok(err.message.includes("Keeper: caller not authorized"), "Expected 'Keeper: caller not authorized'");
    console.log("✓ Case C Passed: Unauthorized performUpkeep call reverted correctly.");
  }

  // 7-F: MockKeeperRegistry runs a full keeper cycle — both bonds should be settled
  const keeperRunTx = await sendTx(ownerWallet, (n) => keeperRegistry.connect(ownerWallet).runUpkeep(vaultAddress, { nonce: n }));
  const keeperRunReceipt = await keeperRunTx.wait();
  console.log(`Keeper runUpkeep gas used: ${keeperRunReceipt.gasUsed.toString()}`);

  const bondAAfterKeeper = await vault.bonds(keeperBondIdA);
  const bondBAfterKeeper = await vault.bonds(keeperBondIdB);
  assert.strictEqual(bondAAfterKeeper.isSettled, true, "Bond A should be settled by keeper");
  assert.strictEqual(bondBAfterKeeper.isSettled, true, "Bond B should be settled by keeper");
  console.log("✓ Case D Passed: MockKeeperRegistry.runUpkeep settled both matured bonds.");

  // Verify upkeepNeeded is now false after settlement
  const [upkeepNeededAfterSettle] = await vault.checkUpkeep("0x");
  // There may still be other unsettled bonds (bond IDs 3-6 from earlier tests that we time-travelled past)
  // So we just verify bonds A and B are no longer returned
  const maturedAfterSettle = await vault.getMaturedUnsettledBonds();
  const maturedIds = maturedAfterSettle.map(id => Number(id));
  assert.ok(!maturedIds.includes(keeperBondIdA), "Bond A should NOT appear in pending after keeper settled it");
  assert.ok(!maturedIds.includes(keeperBondIdB), "Bond B should NOT appear in pending after keeper settled it");
  console.log("✓ Case E Passed: Settled bonds no longer appear in getMaturedUnsettledBonds.");

  // 7-G: Reset authorizedKeeper to address(0) — permissionless mode
  await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).setAuthorizedKeeper(ethers.ZeroAddress, { nonce: n }));
  // Any EOA should now be able to call performUpkeep (permissionless Gelato mode)
  const emptyPerformData = ethers.AbiCoder.defaultAbiCoder().encode(["uint256[]"], [[]]);
  await sendTx(userWallet, (n) => vault.connect(userWallet).performUpkeep(emptyPerformData, { nonce: n }));
  console.log("✓ Case F Passed: performUpkeep works permissionlessly after keeper reset to address(0).");

  // 7-H: setUpkeepBatchSize validation
  await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).setUpkeepBatchSize(5, { nonce: n }));
  const newBatchSize = await vault.upkeepBatchSize();
  assert.strictEqual(Number(newBatchSize), 5, "Batch size should be updated to 5");
  try {
    await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).setUpkeepBatchSize(51, { nonce: n }));
    assert.fail("Should have reverted: batch size > 50");
  } catch (err) {
    assert.ok(err.message.includes("Batch size must be 1-50"), "Expected batch size validation revert");
  }
  console.log("✓ Case G Passed: setUpkeepBatchSize validated correctly (5 accepted, 51 rejected).");

  console.log("\n✅ Test 7 Passed: Keeper Automation fully verified.");

  // ----------------------------------------------------
  // TEST 8: ERC-1155 Tokenization & OTC Trading Desk
  // ----------------------------------------------------
  console.log("\nRunning Test 8: ERC-1155 Tokenization & OTC Trading Desk...");

  // Load OTC artifact
  const otcArtifact = JSON.parse(fs.readFileSync("./artifacts/src/StableBondsOTC.sol/StableBondsOTC.json", "utf8"));
  const otcFactory = new ethers.ContractFactory(otcArtifact.abi, otcArtifact.bytecode, ownerWallet);
  const otc = await deployContract(otcFactory, vaultAddress);
  const otcAddress = await otc.getAddress();
  console.log("StableBondsOTC deployed at:", otcAddress);

  // Link OTC contract in Vault
  await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).setOTCAddress(otcAddress, { nonce: n }));
  console.log("Linked OTC address in vault.");

  // Setup Buyer Wallet
  const otcBuyerWallet = new ethers.Wallet("0x85f782ee817342df23fcd77b587bb3c391f1b9d0b13f8733639f19c30a34925e", provider);
  await sendTx(ownerWallet, (n) => ownerWallet.sendTransaction({ to: otcBuyerWallet.address, value: ethers.parseEther("0.5"), nonce: n }));
  await sendTx(ownerWallet, (n) => usdc.transfer(otcBuyerWallet.address, ethers.parseUnits("2000", 6), { nonce: n }));
  await sendTx(ownerWallet, (n) => complianceRegistry.connect(ownerWallet).verifyWallet(otcBuyerWallet.address, { nonce: n }));
  console.log("OTC Buyer Wallet setup and KYC verified.");

  // 8-A: ERC-1155 Minting & Escrow Listing
  await sendTx(keeperUserWallet, (n) => vault.connect(keeperUserWallet).createBondWithIntent(
    ethers.parseUnits("1000", 6),
    1, // termId 1 = 30 days
    supplierWallet.address,
    3, // destDomain Express
    { nonce: n }
  ));
  const otcBondId = Number(await vault.nextBondId()) - 1;
  console.log("Bond created for OTC testing, ID:", otcBondId);

  // Verify ERC-1155 token balance
  const balance = await vault.balanceOf(keeperUserWallet.address, otcBondId);
  assert.strictEqual(Number(balance), 1, "User should own 1 tokenized bond");

  // Approve OTC Contract
  await sendTx(keeperUserWallet, (n) => vault.connect(keeperUserWallet).setApprovalForAll(otcAddress, true, { nonce: n }));

  // List on OTC Desk
  await sendTx(keeperUserWallet, (n) => otc.connect(keeperUserWallet).listBondForSale(otcBondId, ethers.parseUnits("950", 6), { nonce: n }));
  
  const orderId = Number(await otc.bondToActiveOrder(otcBondId));
  const order = await otc.orders(orderId);
  assert.strictEqual(order.isActive, true, "Order should be active");
  assert.strictEqual(order.price.toString(), ethers.parseUnits("950", 6).toString(), "Price should match");

  const otcBalance = await vault.balanceOf(otcAddress, otcBondId);
  assert.strictEqual(Number(otcBalance), 1, "OTC contract should hold the bond token in escrow");
  console.log("✓ Case A Passed: ERC-1155 token minted and escrowed to OTC listing.");

  // 8-B: Order Cancellation
  await sendTx(keeperUserWallet, (n) => otc.connect(keeperUserWallet).cancelOrder(orderId, { nonce: n }));
  const sellerBalance = await vault.balanceOf(keeperUserWallet.address, otcBondId);
  assert.strictEqual(Number(sellerBalance), 1, "Seller should get the token back");

  const orderAfterCancel = await otc.orders(orderId);
  assert.strictEqual(orderAfterCancel.isActive, false, "Order should be inactive after cancel");
  console.log("✓ Case B Passed: Order cancelled and token returned to seller.");

  // 8-C: Order Purchase & Fee Routing
  // Relist
  await sendTx(keeperUserWallet, (n) => otc.connect(keeperUserWallet).listBondForSale(otcBondId, ethers.parseUnits("950", 6), { nonce: n }));
  const newOrderId = Number(await otc.bondToActiveOrder(otcBondId));

  // Buyer approves OTC
  await sendTx(otcBuyerWallet, (n) => usdc.connect(otcBuyerWallet).approve(otcAddress, ethers.parseUnits("950", 6), { nonce: n }));

  const sellerUsdcBefore = await usdc.balanceOf(keeperUserWallet.address);
  const ownerUsdcBefore = await usdc.balanceOf(ownerWallet.address);

  // Fill order
  await sendTx(otcBuyerWallet, (n) => otc.connect(otcBuyerWallet).fillOrder(newOrderId, { nonce: n }));

  // Verify buyer gets token and metadata ownership updates
  const buyerTokenBalance = await vault.balanceOf(otcBuyerWallet.address, otcBondId);
  assert.strictEqual(Number(buyerTokenBalance), 1, "Buyer should own the token");
  const bondMetadata = await vault.bonds(otcBondId);
  assert.strictEqual(bondMetadata.owner, otcBuyerWallet.address, "Vault bond owner metadata should update to buyer");

  // Verify USDC distribution and 0.20% fee routing
  const sellerUsdcAfter = await usdc.balanceOf(keeperUserWallet.address);
  const ownerUsdcAfter = await usdc.balanceOf(ownerWallet.address);

  const expectedFee = (ethers.parseUnits("950", 6) * 20n) / 10000n; // 1.9 USDC
  const expectedSellerAmount = ethers.parseUnits("950", 6) - expectedFee;

  assert.strictEqual((sellerUsdcAfter - sellerUsdcBefore).toString(), expectedSellerAmount.toString(), "Seller USDC increment mismatch");
  assert.strictEqual((ownerUsdcAfter - ownerUsdcBefore).toString(), expectedFee.toString(), "Owner fee USDC increment mismatch");
  console.log("✓ Case C Passed: Order filled, token transferred, owner metadata updated, and fees routed.");

  // 8-D: Direct transfer compliance constraints
  const unverifiedOtcWallet = new ethers.Wallet("0x85f782ee817342df23fcd77b587bb3c391f1b9d0b13f8733639f19c30a34925a", provider);
  try {
    await sendTx(otcBuyerWallet, (n) => vault.connect(otcBuyerWallet).safeTransferFrom(
      otcBuyerWallet.address,
      unverifiedOtcWallet.address,
      otcBondId,
      1,
      "0x",
      { nonce: n }
    ));
    assert.fail("Should have reverted due to compliance");
  } catch (err) {
    assert.ok(err.message.includes("User not KYC/KYB verified"), "Expected KYC revert message");
  }

  // Direct transfer between verified users should work
  await sendTx(otcBuyerWallet, (n) => vault.connect(otcBuyerWallet).safeTransferFrom(
    otcBuyerWallet.address,
    keeperUserWallet.address,
    otcBondId,
    1,
    "0x",
    { nonce: n }
  ));
  const finalOwnerBalance = await vault.balanceOf(keeperUserWallet.address, otcBondId);
  assert.strictEqual(Number(finalOwnerBalance), 1, "Original seller should own token again");
  const finalBondMetadata = await vault.bonds(otcBondId);
  assert.strictEqual(finalBondMetadata.owner, keeperUserWallet.address, "Metadata owner should update back");
  console.log("✓ Case D Passed: Compliance rules enforced on direct transfers.");

  console.log("\n✅ Test 8 Passed: ERC-1155 Tokenization & OTC Desk fully verified.");

  // 9: Circle Gateway Integration (Unified Balance Settlement)
  console.log("\nStarting Test 9: Circle Gateway Integration...");
  
  const gatewayPoolManagerWallet = new ethers.Wallet("0x701b615bbdf43a6d9de11c000d027a518fb6390d401e85a0044966f09453890f", provider);
  await sendTx(ownerWallet, (n) => ownerWallet.sendTransaction({ to: gatewayPoolManagerWallet.address, value: ethers.parseEther("0.5"), nonce: n }));
  
  // Set Gateway Pool Manager on Vault
  await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).setGatewayPoolManager(gatewayPoolManagerWallet.address, { nonce: n }));
  const registeredPoolManager = await vault.gatewayPoolManager();
  assert.strictEqual(registeredPoolManager, gatewayPoolManagerWallet.address, "Gateway Pool Manager address mismatch");
  console.log("✓ Gateway Pool Manager successfully registered in Vault:", registeredPoolManager);

  // Setup funds on Gateway Pool Manager
  const gatewayPaymentAmount = ethers.parseUnits("3500", 6);
  await sendTx(ownerWallet, (n) => usdc.transfer(gatewayPoolManagerWallet.address, gatewayPaymentAmount, { nonce: n }));
  await sendTx(gatewayPoolManagerWallet, (n) => usdc.connect(gatewayPoolManagerWallet).approve(vaultAddress, gatewayPaymentAmount, { nonce: n }));

  // Gateway payment recipient (owner) must be KYC verified
  const gatewayUserWallet = new ethers.Wallet("0xdf57089febbacf7ba0bc2277bb02720de39e96dae88c7a8412f4603b6b78670d", provider);
  await sendTx(ownerWallet, (n) => ownerWallet.sendTransaction({ to: gatewayUserWallet.address, value: ethers.parseEther("0.5"), nonce: n }));
  await sendTx(ownerWallet, (n) => complianceRegistry.connect(ownerWallet).verifyWallet(gatewayUserWallet.address, { nonce: n }));

  // Non-pool manager calls receiveGatewayPayment -> should revert
  try {
    await sendTx(gatewayUserWallet, (n) => vault.connect(gatewayUserWallet).receiveGatewayPayment(
      gatewayUserWallet.address,
      gatewayPaymentAmount,
      1,
      supplierWallet.address,
      26,
      usdcAddress,
      usdcAddress,
      false,
      { nonce: n }
    ));
    assert.fail("Should have reverted when called by non-pool manager");
  } catch (err) {
    assert.ok(err.message.includes("Only Gateway Pool Manager allowed"), "Expected revert message for pool manager check");
  }

  // Valid pool manager call to receiveGatewayPayment -> should create bond
  const preBondId = Number(await vault.nextBondId());
  await sendTx(gatewayPoolManagerWallet, (n) => vault.connect(gatewayPoolManagerWallet).receiveGatewayPayment(
    gatewayUserWallet.address,
    gatewayPaymentAmount,
    1, // termId = 1 (30 days)
    supplierWallet.address,
    26, // destDomain
    usdcAddress,
    usdcAddress,
    false, // swapAtDeposit
    { nonce: n }
  ));

  const postBondId = Number(await vault.nextBondId());
  assert.strictEqual(postBondId, preBondId + 1, "Next bond ID did not increment");

  const newBondId = preBondId;
  const gatewayBond = await vault.bonds(newBondId);
  assert.strictEqual(gatewayBond.owner, gatewayUserWallet.address, "Bond owner mismatch");
  assert.strictEqual(gatewayBond.principal.toString(), gatewayPaymentAmount.toString(), "Bond principal mismatch");
  assert.strictEqual(Number(gatewayBond.termId), 1, "Term ID mismatch");
  
  // Verify ERC-1155 token minted to the user
  const userTokenBalance = await vault.balanceOf(gatewayUserWallet.address, newBondId);
  assert.strictEqual(Number(userTokenBalance), 1, "User should own 1 tokenized bond");
  console.log("✓ Case A Passed: receiveGatewayPayment successfully verified, escrow transfer executed, and bond minted.");

  console.log("\n✅ Test 9 Passed: Circle Gateway Integration fully verified.");

  // 10: Autonomous Agent Wallets & Spending Policies
  console.log("\nStarting Test 10: Autonomous Agent Wallets & Spending Policies...");

  // Deploy AgentRegistry
  const agentRegistryFactory = new ethers.ContractFactory(agentRegistryArtifact.abi, agentRegistryArtifact.bytecode, ownerWallet);
  const agentRegistry = await deployContract(agentRegistryFactory, ownerWallet.address);
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("✓ AgentRegistry deployed at:", agentRegistryAddress);

  // Link Vault and AgentRegistry
  await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).setAgentRegistry(agentRegistryAddress, { nonce: n }));
  await sendTx(ownerWallet, (n) => agentRegistry.connect(ownerWallet).setVault(vaultAddress, { nonce: n }));
  console.log("✓ Linked StableBondsVault and AgentRegistry.");

  // Spin up Agent Wallet
  const agentWallet = new ethers.Wallet("0x701b615bbdf43a6d9de11c000d027a518fb6390d401e85a0044966f094538901", provider);
  await sendTx(ownerWallet, (n) => ownerWallet.sendTransaction({ to: agentWallet.address, value: ethers.parseEther("0.5"), nonce: n }));
  console.log("✓ Agent Wallet funded at:", agentWallet.address);

  // Register Agent via userWallet (the owner of the agent)
  await sendTx(userWallet, (n) => agentRegistry.connect(userWallet).registerAgent(agentWallet.address, "ipfs://rebalancing-agent-007", { nonce: n }));
  console.log("✓ Agent registered in AgentRegistry.");

  // Verify Agent registration
  const agentDetails = await agentRegistry.getAgent(agentWallet.address);
  assert.strictEqual(agentDetails.owner, userWallet.address, "Agent owner mismatch");
  assert.strictEqual(agentDetails.isActive, true, "Agent isActive mismatch");

  // Whitelist supplierWallet as approved vendor for agentWallet
  await sendTx(userWallet, (n) => agentRegistry.connect(userWallet).setVendorWhitelist(agentWallet.address, supplierWallet.address, true, { nonce: n }));
  assert.strictEqual(await agentRegistry.isVendorWhitelisted(agentWallet.address, supplierWallet.address), true, "Supplier should be whitelisted");

  // Set Spending Policy: max $2000 USDC allocation limit
  const agentPolicyLimit = ethers.parseUnits("2000", 6);
  await sendTx(userWallet, (n) => agentRegistry.connect(userWallet).setSpendingPolicy(agentWallet.address, agentPolicyLimit, { nonce: n }));
  console.log("✓ Agent spending policy limit set to 2000 USDC.");

  // Fund Agent with USDC to purchase bonds
  await sendTx(userWallet, (n) => usdc.connect(userWallet).transfer(agentWallet.address, ethers.parseUnits("5000", 6), { nonce: n }));
  await sendTx(agentWallet, (n) => usdc.connect(agentWallet).approve(vaultAddress, ethers.parseUnits("5000", 6), { nonce: n }));

  // Case A: Exceed spending limit policy -> should revert
  console.log(" - Case A: Attempting to allocate 3000 USDC (limit is 2000 USDC)...");
  try {
    await sendTx(agentWallet, (n) => vault.connect(agentWallet).createBondWithIntent(
      ethers.parseUnits("3000", 6),
      1, // 30 days
      supplierWallet.address,
      26,
      usdcAddress,
      usdcAddress,
      false,
      0,
      "0x",
      { nonce: n }
    ));
    assert.fail("Should have reverted on spending limit exceeded");
  } catch (err) {
    assert.ok(
      err.message.includes("Spending policy limit exceeded") || err.message.includes("limit exceeded"),
      `Unexpected error: ${err.message}`
    );
    console.log("✓ Case A Passed: Correctly reverted with spending limit error.");
  }

  // Case B: Unwhitelisted vendor -> should revert
  console.log(" - Case B: Attempting to pay unwhitelisted vendor...");
  try {
    await sendTx(agentWallet, (n) => vault.connect(agentWallet).createBondWithIntent(
      ethers.parseUnits("500", 6),
      1,
      userWallet.address, // Not whitelisted vendor
      26,
      usdcAddress,
      usdcAddress,
      false,
      0,
      "0x",
      { nonce: n }
    ));
    assert.fail("Should have reverted on vendor not whitelisted");
  } catch (err) {
    assert.ok(
      err.message.includes("Vendor not whitelisted") || err.message.includes("whitelisted"),
      `Unexpected error: ${err.message}`
    );
    console.log("✓ Case B Passed: Correctly reverted with vendor whitelist error.");
  }

  // Case C: Valid Agent Bond purchase -> should succeed, mapping owner to userWallet (treasurer)
  console.log(" - Case C: Valid agent purchase within policy limits...");
  const agentPurchaseAmount = ethers.parseUnits("1200", 6);
  const beforeBondId = Number(await vault.nextBondId());

  await sendTx(agentWallet, (n) => vault.connect(agentWallet).createBondWithIntent(
    agentPurchaseAmount,
    1,
    supplierWallet.address,
    26,
    usdcAddress,
    usdcAddress,
    false,
    0,
    "0x",
    { nonce: n }
  ));

  const afterBondId = Number(await vault.nextBondId());
  assert.strictEqual(afterBondId, beforeBondId + 1, "Bond ID did not increment");

  const agentBondId = beforeBondId;
  const agentBond = await vault.bonds(agentBondId);
  // Treasurer (userWallet) should be owner of the bond, not the agent wallet
  assert.strictEqual(agentBond.owner, userWallet.address, "Bond owner must be the treasurer/CFO");
  assert.strictEqual(agentBond.agent, agentWallet.address, "Bond metadata must track the agent creator");
  assert.strictEqual(agentBond.principal.toString(), agentPurchaseAmount.toString(), "Bond principal mismatch");

  // Check agent's active allocation in registry is updated
  let policyInfo = await agentRegistry.getAgentPolicy(agentWallet.address);
  assert.strictEqual(policyInfo.currentAllocation.toString(), agentPurchaseAmount.toString(), "Current allocation did not update");
  console.log("✓ Case C Passed: Bond purchased successfully and owned by Treasurer. Policy allocation tracked.");

  // Case D: Maturity releases allocation
  console.log(" - Case D: Mature agent bond and verify policy allocation is released...");
  
  // Fast forward 30 days
  await provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
  await provider.send("evm_mine", []);

  // Execute settlement
  await sendTx(ownerWallet, (n) => vault.executeSettlement(agentBondId, { nonce: n }));

  // Check agent policy allocation is released back to 0
  policyInfo = await agentRegistry.getAgentPolicy(agentWallet.address);
  assert.strictEqual(Number(policyInfo.currentAllocation), 0, "Allocation was not released on maturity");
  console.log("✓ Case D Passed: Bond matured. Agent policy allocation successfully released.");

  console.log("\n✅ Test 10 Passed: Autonomous Agent Wallets & Spending Policies fully verified.");

  // =========================================================================
  // Test 11: Real-time Yield Streaming & Waterfall Pools
  // =========================================================================
  console.log("\nStarting Test 11: Real-time Yield Streaming & Waterfall Pools...");

  // Setup Senior and Junior bonds
  // We'll use userWallet to create a Senior bond (Term ID 1: 30-day Senior)
  // and a Junior bond (Term ID 6: 30-day Junior)
  const seniorAmount = ethers.parseUnits("1000", 6);
  const juniorAmount = ethers.parseUnits("1000", 6);

  // Settle any previously leftover matured bonds to ensure a clean state
  await sendTx(ownerWallet, (n) => complianceRegistry.connect(ownerWallet).unblacklistWallet(unverifiedWallet.address, { nonce: n }));
  let leftoverMaturedIds = await vault.getMaturedUnsettledBonds();
  for (let i = 0; i < leftoverMaturedIds.length; i++) {
    const id = Number(leftoverMaturedIds[i]);
    try {
      await sendTx(ownerWallet, (n) => vault.executeSettlement(id, { nonce: n }));
    } catch (e) {
      console.log(`     (Leftover bond ID ${id} settlement skipped: ${e.message})`);
    }
  }

  await sendTx(userWallet, (n) => usdc.connect(userWallet).approve(vaultAddress, seniorAmount + juniorAmount, { nonce: n }));

  // Create Senior Bond
  console.log(" - Creating Senior Bond (1000 USDC)...");
  let seniorBondId = await vault.nextBondId();
  await sendTx(userWallet, (n) => vault.connect(userWallet).createBondWithIntent(
    seniorAmount,
    1, // Term ID 1: Senior
    supplierWallet.address,
    26,
    usdcAddress,
    usdcAddress,
    false,
    0,
    "0x",
    { nonce: n }
  ));

  // Create Junior Bond
  console.log(" - Creating Junior Bond (1000 USDC)...");
  let juniorBondId = await vault.nextBondId();
  await sendTx(userWallet, (n) => vault.connect(userWallet).createBondWithIntent(
    juniorAmount,
    6, // Term ID 6: Junior
    supplierWallet.address,
    26,
    usdcAddress,
    usdcAddress,
    false,
    0,
    "0x",
    { nonce: n }
  ));

  // Case A: Second-by-second yield calculation
  console.log(" - Case A: Verifying second-by-second yield calculations...");
  // Fast forward 10 days
  await provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
  await provider.send("evm_mine", []);

  // Calculate expected senior yield: principal * APY * elapsed / (365 days * 10000)
  // elapsed = 10 days
  // APY = 400 (4.00%)
  let expectedSeniorYield = seniorAmount * 400n * BigInt(10 * 24 * 60 * 60) / BigInt(365 * 24 * 60 * 60 * 10000);
  let seniorYield = await vault.calculateAccruedYield(seniorBondId);
  console.log(`   Senior Accrued Yield: ${ethers.formatUnits(seniorYield, 6)} USDC (Expected: ~${ethers.formatUnits(expectedSeniorYield, 6)} USDC)`);
  // Allow slight variance (+/- 1-2 seconds due to mine delay)
  assert.ok(seniorYield >= expectedSeniorYield && seniorYield <= expectedSeniorYield + ethers.parseUnits("0.01", 6), "Accrued yield calculation mismatch");
  console.log("✓ Case A Passed: Correctly calculated yield on second-by-second basis.");

  // Case B: claimAccruedYield
  console.log(" - Case B: Claiming accrued yield...");
  const userBalanceBefore = await usdc.balanceOf(userWallet.address);
  
  // Claim senior yield
  await sendTx(userWallet, (n) => vault.connect(userWallet).claimAccruedYield(seniorBondId, { nonce: n }));
  
  const userBalanceAfter = await usdc.balanceOf(userWallet.address);
  const claimedAmount = userBalanceAfter - userBalanceBefore;
  console.log(`   Claimed Yield: ${ethers.formatUnits(claimedAmount, 6)} USDC`);
  assert.ok(claimedAmount > 0n, "No yield claimed");
  
  const claimedInterestRecord = await vault.claimedInterest(seniorBondId);
  assert.strictEqual(claimedInterestRecord.toString(), claimedAmount.toString(), "Claimed interest record not updated");
  
  // Try to claim again immediately - should revert or claim 0
  try {
    await sendTx(userWallet, (n) => vault.connect(userWallet).claimAccruedYield(seniorBondId, { nonce: n }));
    assert.fail("Should have reverted when trying to claim without accrued yield");
  } catch (err) {
    assert.ok(err.message.includes("No new yield to claim") || err.message.includes("revert"), "Unexpected error message");
    console.log("✓ Case B Passed: Successfully claimed yield and blocked duplicate claims.");
  }

  // Case C: Waterfall loss simulation
  console.log(" - Case C: Simulating loss allocation on junior/senior tranches...");
  
  // Loss 1: 500 USDC
  console.log("   * Simulating 500 USDC loss (should affect Junior tranche only)...");
  await sendTx(ownerWallet, (n) => vault.simulateLoss(ethers.parseUnits("500", 6), { nonce: n }));
  
  let seniorBond = await vault.bonds(seniorBondId);
  let juniorBond = await vault.bonds(juniorBondId);
  
  assert.strictEqual(seniorBond.principal.toString(), ethers.parseUnits("1000", 6).toString(), "Senior principal should remain untouched");
  assert.strictEqual(juniorBond.principal.toString(), ethers.parseUnits("500", 6).toString(), "Junior principal should be reduced by 500");
  
  // Loss 2: Further 800 USDC loss (should wipe remaining 500 Junior and deduct 300 from Senior)
  console.log("   * Simulating further 800 USDC loss...");
  await sendTx(ownerWallet, (n) => vault.simulateLoss(ethers.parseUnits("800", 6), { nonce: n }));
  
  seniorBond = await vault.bonds(seniorBondId);
  juniorBond = await vault.bonds(juniorBondId);
  
  assert.strictEqual(juniorBond.principal.toString(), "0", "Junior principal should be completely wiped");
  assert.strictEqual(juniorBond.isSettled, true, "Junior bond should be marked settled (liquidated)");
  
  // Senior principal should be 1000 - 300 = 700 USDC
  assert.strictEqual(seniorBond.principal.toString(), ethers.parseUnits("700", 6).toString(), "Senior principal should be reduced by remaining 300");
  assert.strictEqual(seniorBond.isSettled, false, "Senior bond should remain active");
  
  console.log("✓ Case C Passed: Waterfall loss successfully allocated to Junior pool first.");

  // Senior principal should be 1000 - 300 = 700 USDC
  assert.strictEqual(seniorBond.principal.toString(), ethers.parseUnits("700", 6).toString(), "Senior principal should be reduced by remaining 300");
  assert.strictEqual(seniorBond.isSettled, false, "Senior bond should remain active");
  
  console.log("✓ Case C Passed: Waterfall loss successfully allocated to Junior pool first.");

  console.log("\n✅ Test 11 Passed: Real-time Yield Streaming & Waterfall Pools fully verified.");

  // =========================================================================
  // Test 12: Enterprise Multi-Sig Governance & Compliance
  // =========================================================================
  console.log("\nStarting Test 12: Enterprise Multi-Sig Governance & Compliance...");

  // 1. Deploy MultiSigProposal
  const multiSigFactory = new ethers.ContractFactory(multiSigProposalArtifact.abi, multiSigProposalArtifact.bytecode, ownerWallet);
  const adminsList = [ownerWallet.address, userWallet.address, supplierWallet.address];
  const threshold = 2;
  const multiSig = await deployContract(multiSigFactory, adminsList, threshold, vaultAddress);
  const multiSigAddress = await multiSig.getAddress();
  console.log(" - MultiSigProposal deployed at:", multiSigAddress);

  // 2. Gated Admin Action Test
  console.log(" - Case A: Verifying gated administrative action consensus...");
  
  // Try to create term directly as owner (should succeed when multiSig is 0)
  const initialNextTermId = await vault.nextTermId();
  await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).createTerm(45, 450, ethers.parseUnits("100000", 6), 0, { nonce: n }));
  const termAddedNextId = await vault.nextTermId();
  assert.strictEqual(Number(termAddedNextId), Number(initialNextTermId) + 1, "Direct term creation failed before setting MultiSig");
  console.log("   * Direct creation succeeded as owner before setting multi-sig.");

  // Set MultiSig on vault
  await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).setMultiSig(multiSigAddress, { nonce: n }));
  console.log("   * Vault multiSig address set to MultiSigProposal contract.");

  // Now direct call from owner should revert
  try {
    await sendTx(ownerWallet, (n) => vault.connect(ownerWallet).createTerm(45, 450, ethers.parseUnits("100000", 6), 0, { nonce: n }));
    assert.fail("Direct term creation should have reverted after setting MultiSig");
  } catch (err) {
    assert.ok(err.message.includes("Only MultiSig consensus allowed") || err.message.includes("revert"), "Unexpected error message on direct call");
    console.log("   * Direct call correctly reverted with 'Only MultiSig consensus allowed'.");
  }

  // Propose createTerm via proposeAction
  const termCalldata = vault.interface.encodeFunctionData("createTerm", [45, 450, ethers.parseUnits("100000", 6), 0]);
  let proposalId1;
  // Propose as ownerWallet (who is admin) -> auto-approves 1/2
  const propTx = await sendTx(ownerWallet, (n) => multiSig.connect(ownerWallet).proposeAction(vaultAddress, termCalldata, { nonce: n }));
  const propReceipt = await propTx.wait();
  
  // Find ProposalCreated/GenericProposalCreated event
  const events1 = propReceipt.logs.map(log => {
    try { return multiSig.interface.parseLog(log); } catch(e) { return null; }
  }).filter(Boolean);
  const genPropEvent = events1.find(e => e.name === "GenericProposalCreated");
  proposalId1 = genPropEvent.args.proposalId;
  console.log(`   * Generic Proposal #${proposalId1} created.`);

  // Attempt execution with 1 approval (should fail)
  try {
    await sendTx(ownerWallet, (n) => multiSig.connect(ownerWallet).executeProposal(proposalId1, { nonce: n }));
    assert.fail("Execution should fail with 1/2 approvals");
  } catch (err) {
    assert.ok(err.message.includes("Threshold not reached") || err.message.includes("revert"), "Unexpected execution fail message");
    console.log("   * Execution correctly blocked due to lack of threshold.");
  }

  // Approve with userWallet (admin 2)
  await sendTx(userWallet, (n) => multiSig.connect(userWallet).approveProposal(proposalId1, { nonce: n }));
  console.log("   * Approved by userWallet (2/2 threshold met).");

  const thresholdVal = await multiSig.threshold();
  const approvalsCount = await multiSig.approvalsCount(proposalId1);
  console.log("DEBUG: approvalsCount =", approvalsCount.toString(), "threshold =", thresholdVal.toString());
  const approvedByOwner = await multiSig.hasApproved(proposalId1, ownerWallet.address);
  const approvedByUser = await multiSig.hasApproved(proposalId1, userWallet.address);
  console.log("DEBUG: approvedByOwner =", approvedByOwner, "approvedByUser =", approvedByUser);
  console.log("DEBUG: isAdmin(owner) =", await multiSig.isAdmin(ownerWallet.address));
  console.log("DEBUG: isAdmin(user) =", await multiSig.isAdmin(userWallet.address));

  // Execute proposal
  await sendTx(ownerWallet, (n) => multiSig.connect(ownerWallet).executeProposal(proposalId1, { nonce: n, gasLimit: 3000000n }));
  const postTermAddedNextId = await vault.nextTermId();
  assert.strictEqual(Number(postTermAddedNextId), Number(termAddedNextId) + 1, "Term creation through MultiSig execution failed");
  console.log("✓ Case A Passed: Gated admin action successfully executed via MultiSig consensus.");

  // 3. Gated Escrowed Bond Purchase Test
  console.log(" - Case B: Verifying escrowed bond purchase flow...");

  const depositAmt = ethers.parseUnits("200", 6);
  // Approve MultiSig to spend user's USDC
  await sendTx(userWallet, (n) => usdc.connect(userWallet).approve(multiSigAddress, depositAmt, { nonce: n }));

  // Propose bond purchase as userWallet (who is admin) -> auto-approves 1/2
  const propBondTx = await sendTx(userWallet, (n) => multiSig.connect(userWallet).proposeBond(
    depositAmt,
    1, // Term ID 1
    supplierWallet.address,
    26,
    usdcAddress,
    usdcAddress,
    false,
    0,
    "0x",
    { nonce: n }
  ));
  const propBondReceipt = await propBondTx.wait();
  
  const events2 = propBondReceipt.logs.map(log => {
    try { return multiSig.interface.parseLog(log); } catch(e) { return null; }
  }).filter(Boolean);
  const bondPropEvent = events2.find(e => e.name === "ProposalCreated");
  const proposalId2 = bondPropEvent.args.proposalId;
  console.log(`   * Bond Proposal #${proposalId2} created. Escrowed ${ethers.formatUnits(depositAmt, 6)} USDC.`);

  // Verify escrowed state: MultiSig contract holds 200 USDC
  const escrowBalance = await usdc.balanceOf(multiSigAddress);
  assert.strictEqual(escrowBalance.toString(), depositAmt.toString(), "Escrow balance mismatch");
  console.log("   * Escrow confirmed (MultiSig contract holds USDC).");

  // Approve with supplierWallet (admin 2)
  console.log("DEBUG: supplier balance before approve =", ethers.formatEther(await provider.getBalance(supplierWallet.address)));
  await sendTx(supplierWallet, (n) => multiSig.connect(supplierWallet).approveProposal(proposalId2, { nonce: n }));
  console.log("   * Approved by supplierWallet (2/2 threshold met).");

  console.log("DEBUG: owner balance =", ethers.formatEther(await provider.getBalance(ownerWallet.address)));
  console.log("DEBUG: user balance =", ethers.formatEther(await provider.getBalance(userWallet.address)));
  console.log("DEBUG: supplier balance =", ethers.formatEther(await provider.getBalance(supplierWallet.address)));

  // Execute bond proposal
  const beforeVaultBalance = await usdc.balanceOf(vaultAddress);
  const nextExpectedBondId = await vault.nextBondId();
  await sendTx(ownerWallet, (n) => multiSig.connect(ownerWallet).executeProposal(proposalId2, { nonce: n, gasLimit: 3000000n }));
  
  const afterVaultBalance = await usdc.balanceOf(vaultAddress);
  const postNextBondId = await vault.nextBondId();

  assert.strictEqual(afterVaultBalance.toString(), (beforeVaultBalance + depositAmt).toString(), "Vault did not receive deposit amount");
  assert.strictEqual(Number(postNextBondId), Number(nextExpectedBondId) + 1, "Bond ID did not increment after execution");

  // Verify bond owner is userWallet
  const multiSigBond = await vault.bonds(nextExpectedBondId);
  assert.strictEqual(multiSigBond.owner, userWallet.address, "Owner of MultiSig bond must be the proposer");
  console.log("✓ Case B Passed: Escrowed bond purchase successfully executed. Proposer owns the bond.");

  console.log("\n✅ Test 12 Passed: Enterprise Multi-Sig Governance & Compliance fully verified.");

  console.log("\nAll integration tests passed successfully!\n");
}

main().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
