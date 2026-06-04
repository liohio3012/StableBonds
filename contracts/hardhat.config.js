import "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

let pKey = process.env.PRIVATE_KEY || "";
if (pKey && !pKey.startsWith("0x")) {
  pKey = "0x" + pKey;
}
const accounts = pKey ? [pKey] : [];

export default {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  paths: {
    sources: "./src"
  },
  networks: {
    arcTestnet: {
      type: "http",
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: accounts,
    }
  }
};
