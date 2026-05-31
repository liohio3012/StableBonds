import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";

async function main() {
  console.log("Deploying StableBondsVault to Arc Testnet...");

  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const CCTP_TOKEN_MESSENGER = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA";

  const pKey = process.env.PRIVATE_KEY;
  if (!pKey) throw new Error("PRIVATE_KEY missing in .env");

  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(pKey, provider);

  const artifactStr = fs.readFileSync("./artifacts/src/StableBondsVault.sol/StableBondsVault.json", "utf8");
  const artifact = JSON.parse(artifactStr);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  console.log("Sending deployment transaction...");
  const vault = await factory.deploy(USDC_ADDRESS, CCTP_TOKEN_MESSENGER);

  await vault.waitForDeployment();
  const address = await vault.getAddress();

  console.log("✅ StableBondsVault deployed to:", address);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
