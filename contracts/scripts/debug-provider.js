import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.BrowserProvider(hre.network.provider);
  const signer = await provider.getSigner(0);
  console.log("Signer address:", await signer.getAddress());
}

main().catch(console.error);
