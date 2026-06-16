import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";

async function main() {
  console.log("=== Starting Deploy StableBonds Stack to Arc Testnet ===");

  const pKey = process.env.PRIVATE_KEY;
  if (!pKey) throw new Error("PRIVATE_KEY missing in .env");

  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(pKey, provider);
  const deployerAddress = await wallet.getAddress();
  console.log("Deployer Address:", deployerAddress);

  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
  const CCTP_TOKEN_MESSENGER = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA";

  // 1. Deploy ComplianceRegistry
  console.log("\n1. Deploying ComplianceRegistry...");
  const registryArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ComplianceRegistry.sol/ComplianceRegistry.json", "utf8"));
  const registryFactory = new ethers.ContractFactory(registryArtifact.abi, registryArtifact.bytecode, wallet);
  const registry = await registryFactory.deploy(deployerAddress);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("✅ ComplianceRegistry deployed to:", registryAddr);

  // 2. Deploy MockStableFX
  console.log("\n2. Deploying MockStableFX...");
  const stableFXArtifact = JSON.parse(fs.readFileSync("./artifacts/src/mocks/Mocks.sol/MockStableFX.json", "utf8"));
  const stableFXFactory = new ethers.ContractFactory(stableFXArtifact.abi, stableFXArtifact.bytecode, wallet);
  const stableFX = await stableFXFactory.deploy(USDC_ADDRESS, EURC_ADDRESS);
  await stableFX.waitForDeployment();
  const stableFXAddr = await stableFX.getAddress();
  console.log("✅ MockStableFX deployed to:", stableFXAddr);

  // 3. Deploy StableBondsVault
  console.log("\n3. Deploying StableBondsVault...");
  const vaultArtifact = JSON.parse(fs.readFileSync("./artifacts/src/StableBondsVault.sol/StableBondsVault.json", "utf8"));
  const vaultFactory = new ethers.ContractFactory(vaultArtifact.abi, vaultArtifact.bytecode, wallet);
  const vault = await vaultFactory.deploy(
    USDC_ADDRESS,
    EURC_ADDRESS,
    CCTP_TOKEN_MESSENGER,
    stableFXAddr,
    registryAddr
  );
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("✅ StableBondsVault deployed to:", vaultAddr);

  // 4. Deploy StableBondsOTC
  console.log("\n4. Deploying StableBondsOTC...");
  const otcArtifact = JSON.parse(fs.readFileSync("./artifacts/src/StableBondsOTC.sol/StableBondsOTC.json", "utf8"));
  const otcFactory = new ethers.ContractFactory(otcArtifact.abi, otcArtifact.bytecode, wallet);
  const otc = await otcFactory.deploy(vaultAddr);
  await otc.waitForDeployment();
  const otcAddr = await otc.getAddress();
  console.log("✅ StableBondsOTC deployed to:", otcAddr);

  // 5. Link OTC inside Vault
  console.log("\n5. Linking OTC Address in Vault...");
  const setOtcTx = await vault.setOTCAddress(otcAddr);
  await setOtcTx.wait();
  console.log("✅ OTC address linked successfully in Vault.");

  // 6. Pre-whitelist known tester wallets for compliance to avoid revert during test
  console.log("\n6. Auto-verifying tester addresses in ComplianceRegistry...");
  const testerWallets = [
    deployerAddress, // Deployer EOA
    "0x05add586166904a863a666ef842e23367af6718d", // User Smart Account (SCA)
    "0x600207fD8116C4F32bfD81a62965682A46CD1d3B"  // User EOA (MetaMask)
  ];

  for (const addr of testerWallets) {
    try {
      console.log(`Verifying: ${addr}...`);
      const tx = await registry.verifyWallet(addr);
      await tx.wait();
      console.log(`✅ Verified: ${addr}`);
    } catch (e) {
      console.error(`Failed to verify ${addr}:`, e.message);
    }
  }

  console.log("\n=== Deployment Completed Successfully! ===");
  console.log("Please save these addresses to your frontend components:");
  console.log("VAULT_ADDRESS =", `"${vaultAddr}"`);
  console.log("OTC_ADDRESS =", `"${otcAddr}"`);
  console.log("COMPLIANCE_REGISTRY_ADDRESS =", `"${registryAddr}"`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
