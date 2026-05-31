import { NextResponse } from 'next/server';
import { CircleDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { createPublicClient, http, parseAbi, encodeFunctionData } from 'viem';
import { arcTestnet } from 'viem/chains';

// Enterprise Relayer Architecture using Circle Programmable Wallets
// This replaces the raw Private Key with Circle's WaaS (Wallet as a Service)

const RPC_URL = process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
const VAULT_ADDRESS = "0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" as `0x${string}`;

// Circle Developer API Credentials
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const ENTITY_SECRET_CIPHERTEXT = process.env.ENTITY_SECRET_CIPHERTEXT;
const DEVELOPER_WALLET_ID = process.env.CIRCLE_WALLET_ID;

const VAULT_ABI = parseAbi([
  "function nextBondId() view returns (uint256)",
  "function bonds(uint256) view returns (address owner, uint256 principal, uint256 yieldBps, uint256 maturityDate, bool isSettled, (address supplier, uint32 destDomain, bool isConfigured) intent)",
  "function executeSettlement(uint256 _bondId) external"
]);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Graceful degradation if Circle SDK is not yet configured in environment variables
  if (!CIRCLE_API_KEY || !ENTITY_SECRET_CIPHERTEXT || !DEVELOPER_WALLET_ID) {
    return NextResponse.json({ 
      error: "Enterprise Relayer requires Circle API Key, Entity Secret, and Wallet ID",
      instruction: "Please configure these variables in the .env file to enable Circle WaaS."
    }, { status: 500 });
  }

  try {
    // 1. Read on-chain state to find mature bonds (Using Public Client)
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(RPC_URL)
    });

    const nextIdStr = await publicClient.readContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'nextBondId'
    });
    
    const nextId = Number(nextIdStr);
    if (nextId <= 1) return NextResponse.json({ status: "No bonds exist" });

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const settledBonds = [];

    // 2. Initialize Circle Developer SDK
    const circle = new CircleDeveloperControlledWalletsClient({
      apiKey: CIRCLE_API_KEY,
      entitySecret: ENTITY_SECRET_CIPHERTEXT,
    });

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
        console.log(`[Enterprise Relayer] Bond #${i} matured! Executing via Circle SDK...`);
        
        // 3. Encode the ABI payload
        const callData = encodeFunctionData({
          abi: VAULT_ABI,
          functionName: 'executeSettlement',
          args: [BigInt(i)]
        });

        // 4. Execute Contract Call via Circle Developer-Controlled Wallets
        // This leverages Circle's secure MPC infrastructure instead of a vulnerable local private key
        const response = await circle.createContractExecutionTransaction({
          walletId: DEVELOPER_WALLET_ID,
          contractAddress: VAULT_ADDRESS,
          abiFunctionSignature: "executeSettlement(uint256)",
          abiParameters: [i.toString()],
          fee: {
            type: "level",
            config: {
              feeLevel: "MEDIUM"
            }
          }
        });

        settledBonds.push({
          bondId: i,
          circleTxId: response.data?.id,
          state: response.data?.state,
          supplier: bond[5].supplier,
          destDomain: Number(bond[5].destDomain)
        });
      }
    }

    if (settledBonds.length > 0) {
      return NextResponse.json({ 
        status: "Enterprise Settlement Initiated", 
        success: true, 
        data: settledBonds 
      });
    }

    return NextResponse.json({ status: "No mature bonds found", success: true });

  } catch (error: any) {
    console.error("Circle Enterprise Relayer execution failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
