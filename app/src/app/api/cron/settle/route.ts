import { NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arcTestnet } from 'viem/chains';

// Important: Next.js API Routes run on the server side
// The Private Key is securely loaded from environment variables
const RPC_URL = process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const VAULT_ADDRESS = "0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" as `0x${string}`;

const VAULT_ABI = parseAbi([
  "function nextBondId() view returns (uint256)",
  "function bonds(uint256) view returns (address owner, uint256 principal, uint256 yieldBps, uint256 maturityDate, bool isSettled, (address supplier, uint32 destDomain, bool isConfigured) intent)",
  "function executeSettlement(uint256 _bondId) external"
]);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!PRIVATE_KEY) {
    return NextResponse.json({ error: "Server missing PRIVATE_KEY" }, { status: 500 });
  }

  try {
    const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
    
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(RPC_URL)
    });

    const walletClient = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(RPC_URL)
    });

    const nextIdStr = await publicClient.readContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'nextBondId'
    });
    
    const nextId = Number(nextIdStr);

    if (nextId <= 1) {
      return NextResponse.json({ status: "No bonds exist" });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const settledBonds = [];

    // Scan the last 10 bonds to find ones ready for settlement
    const startId = Math.max(1, nextId - 10);
    for (let i = startId; i < nextId; i++) {
      const bond = await publicClient.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'bonds',
        args: [BigInt(i)]
      });

      const isSettled = bond[4];
      const maturityDate = Number(bond[3]);

      if (!isSettled && currentTimestamp >= maturityDate) {
        console.log(`Bond #${i} matured! Executing autonomous settlement via CCTP...`);
        
        // Execute the settlement
        const { request } = await publicClient.simulateContract({
          account,
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'executeSettlement',
          args: [BigInt(i)]
        });

        const txHash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        
        settledBonds.push({
          bondId: i,
          txHash: txHash,
          supplier: bond[5].supplier,
          destDomain: Number(bond[5].destDomain)
        });
      }
    }

    if (settledBonds.length > 0) {
      return NextResponse.json({ 
        status: "Settlement Executed", 
        success: true, 
        settledCount: settledBonds.length,
        data: settledBonds 
      });
    }

    return NextResponse.json({ status: "No mature bonds found requiring settlement", success: true });

  } catch (error: any) {
    console.error("Relayer execution failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
