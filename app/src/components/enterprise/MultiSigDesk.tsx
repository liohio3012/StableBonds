"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi, formatUnits, encodeFunctionData } from 'viem';
import { Shield, Check, Clock, UserCheck, AlertTriangle, Play, Plus, RefreshCw, X, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import { bundlerClient } from '@/lib/circle-auth';

const VAULT_ADDRESS = "0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" as `0x${string}`;

const VAULT_ABI = parseAbi([
  "function multiSig() view returns (address)",
  "function setMultiSig(address _multiSig) external",
  "function owner() view returns (address)"
]);

const MULTISIG_ABI = parseAbi([
  "function getAdmins() view returns (address[])",
  "function threshold() view returns (uint256)",
  "function nextProposalId() view returns (uint256)",
  "function proposals(uint256) view returns (uint256 id, address proposer, uint256 amount, uint256 termId, address supplier, uint32 destDomain, address depositToken, address settlementToken, bool swapAtDeposit, uint256 minBuyAmount, bool executed, bool isBondProposal, address targetContract)",
  "function approvalsCount(uint256) view returns (uint256)",
  "function hasApproved(uint256, address) view returns (bool)",
  "function approveProposal(uint256 _proposalId) external",
  "function executeProposal(uint256 _proposalId) external",
  "function proposeAction(address _target, bytes _data) external returns (uint256)",
  "function proposeBond(uint256 _amount, uint256 _termId, address _supplier, uint32 _destDomain, address _depositToken, address _settlementToken, bool _swapAtDeposit, uint256 _minBuyAmount, bytes _tradeData) external returns (uint256)"
]);

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
]);

interface Proposal {
  id: number;
  proposer: string;
  amount: string;
  termId: number;
  supplier: string;
  destDomain: number;
  depositToken: string;
  settlementToken: string;
  swapAtDeposit: boolean;
  minBuyAmount: string;
  executed: boolean;
  isBondProposal: boolean;
  targetContract: string;
  approvalsCount: number;
  userHasApproved: boolean;
}

export default function MultiSigDesk() {
  const { address: eoaAddress } = useAccount();
  const { account: circleAccount, isSmartAccount } = useCircleAuth();
  const address = isSmartAccount ? circleAccount?.address : eoaAddress;
  const publicClient = usePublicClient();

  const [multiSigAddress, setMultiSigAddress] = useState<string | null>(null);
  const [vaultOwner, setVaultOwner] = useState<string | null>(null);
  const [adminsList, setAdminsList] = useState<string[]>([]);
  const [threshold, setThreshold] = useState<number>(0);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Forms
  const [newMultiSigAddr, setNewMultiSigAddr] = useState("");
  const [showCreateGenericModal, setShowCreateGenericModal] = useState(false);
  const [showCreateBondModal, setShowCreateBondModal] = useState(false);

  // Form states - Generic
  const [genericTarget, setGenericTarget] = useState("");
  const [genericFunctionSignature, setGenericFunctionSignature] = useState("");
  const [genericArguments, setGenericArguments] = useState("");

  // Form states - Bond
  const [bondAmount, setBondAmount] = useState("1000");
  const [bondTermId, setBondTermId] = useState("1");
  const [bondSupplier, setBondSupplier] = useState("");
  const [bondDestDomain, setBondDestDomain] = useState("26"); // Arc/Circle destination
  const [bondDepositToken, setBondDepositToken] = useState("0x3600000000000000000000000000000000000000");
  const [bondSettlementToken, setBondSettlementToken] = useState("0x3600000000000000000000000000000000000000");
  const [bondSwapAtDeposit, setBondSwapAtDeposit] = useState(false);

  // Web3 write hooks
  const { writeContract: writeVault, isPending: isVaultPending } = useWriteContract();
  const { writeContract: writeMultiSig, isPending: isMultiSigPending } = useWriteContract();

  const fetchMultiSigDetails = async () => {
    if (!publicClient) return;
    setIsRefreshing(true);
    try {
      // 1. Read multiSig & owner address from Vault
      const [msAddr, ownerAddr] = await Promise.all([
        publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'multiSig',
        }),
        publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'owner',
        })
      ]);

      setVaultOwner(ownerAddr);

      if (msAddr && msAddr !== '0x0000000000000000000000000000000000000000') {
        setMultiSigAddress(msAddr);

        // 2. Fetch multiSig config
        const [admins, threshVal, nextIdVal] = await Promise.all([
          publicClient.readContract({
            address: msAddr as `0x${string}`,
            abi: MULTISIG_ABI,
            functionName: 'getAdmins',
          }),
          publicClient.readContract({
            address: msAddr as `0x${string}`,
            abi: MULTISIG_ABI,
            functionName: 'threshold',
          }),
          publicClient.readContract({
            address: msAddr as `0x${string}`,
            abi: MULTISIG_ABI,
            functionName: 'nextProposalId',
          })
        ]);

        setAdminsList(admins as string[]);
        setThreshold(Number(threshVal));

        // 3. Fetch proposals
        const nextId = Number(nextIdVal);
        const propList: Proposal[] = [];

        for (let i = 1; i < nextId; i++) {
          const [prop, approvals, hasUserApproved] = await Promise.all([
            publicClient.readContract({
              address: msAddr as `0x${string}`,
              abi: MULTISIG_ABI,
              functionName: 'proposals',
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: msAddr as `0x${string}`,
              abi: MULTISIG_ABI,
              functionName: 'approvalsCount',
              args: [BigInt(i)],
            }),
            address ? publicClient.readContract({
              address: msAddr as `0x${string}`,
              abi: MULTISIG_ABI,
              functionName: 'hasApproved',
              args: [BigInt(i), address as `0x${string}`],
            }) : Promise.resolve(false)
          ]);

          propList.push({
            id: Number(prop[0]),
            proposer: prop[1],
            amount: formatUnits(prop[2], 6),
            termId: Number(prop[3]),
            supplier: prop[4],
            destDomain: Number(prop[5]),
            depositToken: prop[6],
            settlementToken: prop[7],
            swapAtDeposit: prop[8],
            minBuyAmount: formatUnits(prop[9], 6),
            executed: prop[10],
            isBondProposal: prop[11],
            targetContract: prop[12],
            approvalsCount: Number(approvals),
            userHasApproved: Boolean(hasUserApproved)
          });
        }

        // Sort descending (newest first)
        setProposals(propList.reverse());
      } else {
        setMultiSigAddress(null);
      }
    } catch (e) {
      console.error("Failed to load MultiSig details:", e);
    } finally {
      setIsInitializing(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMultiSigDetails();
  }, [address, publicClient]);

  // Set MultiSig on Vault
  const handleSetMultiSig = async () => {
    if (!newMultiSigAddr.startsWith("0x") || newMultiSigAddr.length !== 42) {
      toast.error("Invalid address format");
      return;
    }
    
    if (isSmartAccount && circleAccount) {
      try {
        toast.info("Preparing gasless setMultiSig transaction...");
        const executeCall = {
          to: VAULT_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: VAULT_ABI,
            functionName: 'setMultiSig',
            args: [newMultiSigAddr as `0x${string}`],
          }),
        };

        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [executeCall],
          paymaster: true,
        });

        toast.info("Awaiting execution...");
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        toast.success("Consensus contract registered successfully!");
        fetchMultiSigDetails();
      } catch (error: any) {
        toast.error("Set failed: " + (error.message || error));
      }
    } else {
      try {
        writeVault({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'setMultiSig',
          args: [newMultiSigAddr as `0x${string}`],
        });
        toast.success("Set transaction submitted!");
        setTimeout(fetchMultiSigDetails, 4000);
      } catch (error: any) {
        toast.error(error.message || "Failed to set MultiSig address");
      }
    }
  };

  // Propose Administrative Action
  const handleProposeGeneric = async () => {
    if (!genericTarget || !genericFunctionSignature) {
      toast.error("Please fill in target contract and function signature");
      return;
    }

    try {
      // Encode call data
      const cleanArgs = genericArguments ? JSON.parse(`[${genericArguments}]`) : [];
      const tempAbi = parseAbi([`function ${genericFunctionSignature}`] as any);
      const funcName = genericFunctionSignature.split("(")[0];
      const callData = encodeFunctionData({
        abi: tempAbi,
        functionName: funcName,
        args: cleanArgs
      });

      if (isSmartAccount && circleAccount) {
        toast.info("Preparing gasless generic proposal user operation...");
        const executeCall = {
          to: multiSigAddress as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: MULTISIG_ABI,
            functionName: 'proposeAction',
            args: [genericTarget as `0x${string}`, callData],
          }),
        };

        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [executeCall],
          paymaster: true,
        });

        toast.info("Awaiting execution...");
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        toast.success("Administrative proposal successfully registered!");
        setShowCreateGenericModal(false);
        fetchMultiSigDetails();
      } else {
        writeMultiSig({
          address: multiSigAddress as `0x${string}`,
          abi: MULTISIG_ABI,
          functionName: 'proposeAction',
          args: [genericTarget as `0x${string}`, callData],
        });
        toast.success("Administrative proposal transaction submitted!");
        setShowCreateGenericModal(false);
        setTimeout(fetchMultiSigDetails, 4000);
      }
    } catch (e: any) {
      toast.error("Failed to propose administrative action: " + e.message);
    }
  };

  // Propose Escrowed Bond Purchase
  const handleProposeBond = async () => {
    if (!bondSupplier || !bondAmount) {
      toast.error("Please fill in amount and supplier address");
      return;
    }

    const amountWei = BigInt(Math.floor(parseFloat(bondAmount) * 1e6));

    try {
      if (isSmartAccount && circleAccount) {
        toast.info("Preparing gasless escrowed proposal...");
        
        // 1. Approve USDC transfer to MultiSig proposal contract
        const approveCall = {
          to: bondDepositToken as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [multiSigAddress as `0x${string}`, amountWei],
          }),
        };

        // 2. Propose bond purchase
        const proposeCall = {
          to: multiSigAddress as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: MULTISIG_ABI,
            functionName: 'proposeBond',
            args: [
              amountWei,
              BigInt(bondTermId),
              bondSupplier as `0x${string}`,
              Number(bondDestDomain),
              bondDepositToken as `0x${string}`,
              bondSettlementToken as `0x${string}`,
              bondSwapAtDeposit,
              BigInt(0), // minBuyAmount
              "0x" // tradeData
            ],
          }),
        };

        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [approveCall, proposeCall],
          paymaster: true,
        });

        toast.info("Awaiting execution...");
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        toast.success("Escrowed bond proposal successfully registered!");
        setShowCreateBondModal(false);
        fetchMultiSigDetails();
      } else {
        // EOA requires two transactions unless using a batched wallet
        // Let's first check allowance
        const allowance = await publicClient?.readContract({
          address: bondDepositToken as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address as `0x${string}`, multiSigAddress as `0x${string}`],
        });

        if ((allowance as bigint) < amountWei) {
          toast.info("Approve USDC escrow spend in your wallet first...");
          writeMultiSig({
            address: bondDepositToken as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [multiSigAddress as `0x${string}`, amountWei],
          });
          return;
        }

        writeMultiSig({
          address: multiSigAddress as `0x${string}`,
          abi: MULTISIG_ABI,
          functionName: 'proposeBond',
          args: [
            amountWei,
            BigInt(bondTermId),
            bondSupplier as `0x${string}`,
            Number(bondDestDomain),
            bondDepositToken as `0x${string}`,
            bondSettlementToken as `0x${string}`,
            bondSwapAtDeposit,
            BigInt(0), // minBuyAmount
            "0x" // tradeData
          ],
        });
        toast.success("Escrowed bond proposal submitted!");
        setShowCreateBondModal(false);
        setTimeout(fetchMultiSigDetails, 4000);
      }
    } catch (e: any) {
      toast.error("Failed to propose bond: " + e.message);
    }
  };

  // Approve Proposal
  const handleApprove = async (proposalId: number) => {
    if (isSmartAccount && circleAccount) {
      try {
        toast.info(`Preparing gasless approval user operation...`);
        const executeCall = {
          to: multiSigAddress as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: MULTISIG_ABI,
            functionName: 'approveProposal',
            args: [BigInt(proposalId)],
          }),
        };

        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [executeCall],
          paymaster: true,
        });

        toast.info("Awaiting execution...");
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        toast.success(`Proposal #${proposalId} approved!`);
        fetchMultiSigDetails();
      } catch (error: any) {
        toast.error("Approval failed: " + (error.message || error));
      }
    } else {
      try {
        writeMultiSig({
          address: multiSigAddress as `0x${string}`,
          abi: MULTISIG_ABI,
          functionName: 'approveProposal',
          args: [BigInt(proposalId)],
        });
        toast.success(`Approval transaction submitted for Proposal #${proposalId}`);
        setTimeout(fetchMultiSigDetails, 4000);
      } catch (error: any) {
        toast.error(error.message || "Failed to submit approval");
      }
    }
  };

  // Execute Proposal
  const handleExecute = async (proposalId: number) => {
    if (isSmartAccount && circleAccount) {
      try {
        toast.info(`Preparing gasless execution user operation...`);
        const executeCall = {
          to: multiSigAddress as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: MULTISIG_ABI,
            functionName: 'executeProposal',
            args: [BigInt(proposalId)],
          }),
        };

        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [executeCall],
          paymaster: true,
        });

        toast.info("Awaiting execution...");
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        toast.success(`Proposal #${proposalId} successfully executed on-chain!`);
        fetchMultiSigDetails();
      } catch (error: any) {
        toast.error("Execution failed: " + (error.message || error));
      }
    } else {
      try {
        writeMultiSig({
          address: multiSigAddress as `0x${string}`,
          abi: MULTISIG_ABI,
          functionName: 'executeProposal',
          args: [BigInt(proposalId)],
        });
        toast.success(`Execution transaction submitted for Proposal #${proposalId}`);
        setTimeout(fetchMultiSigDetails, 4000);
      } catch (error: any) {
        toast.error(error.message || "Failed to submit execution");
      }
    }
  };

  const isUserAdmin = adminsList.some(admin => admin.toLowerCase() === address?.toLowerCase());

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Loading Governance state...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Configuration Indicator */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Consensus Multi-Sig Desk
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Consensus-gated treasury allocations and administrative adjustments.
          </p>
        </div>
        <button
          onClick={fetchMultiSigDetails}
          disabled={isRefreshing}
          className="btn-secondary text-xs px-3 py-2 gap-1.5"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {!multiSigAddress ? (
        <div className="card-surface p-8 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-md bg-amber-50 flex items-center justify-center mx-auto"
            style={{ color: 'var(--warning)', background: 'var(--warning-soft)' }}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
            Multi-Sig Consensus Not Active
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            The treasury vault is currently managed under direct ownership. CFOs must register a MultiSigProposal consensus contract to enforce multi-signature approval rules for vendor disbursements and configuration updates.
          </p>

          {address?.toLowerCase() === vaultOwner?.toLowerCase() ? (
            <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold text-left" style={{ color: 'var(--foreground)' }}>
                Enable Multi-Sig Consensus (Owner Action)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Consensus Contract Address (0x...)"
                  className="input-base text-xs font-mono grow"
                  value={newMultiSigAddr}
                  onChange={(e) => setNewMultiSigAddr(e.target.value)}
                />
                <button
                  onClick={handleSetMultiSig}
                  className="btn-primary text-xs px-4"
                >
                  Activate
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Only the vault owner address ({vaultOwner?.slice(0, 6)}...{vaultOwner?.slice(-4)}) can initialize multi-sig consensus.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Proposals
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateBondModal(true)}
                  className="btn-secondary text-xs px-2.5 py-1.5 gap-1"
                >
                  <Plus size={13} />
                  Bond Purchase
                </button>
                <button
                  onClick={() => setShowCreateGenericModal(true)}
                  className="btn-secondary text-xs px-2.5 py-1.5 gap-1"
                >
                  <Plus size={13} />
                  Admin Action
                </button>
              </div>
            </div>

            {proposals.length === 0 ? (
              <div className="card-surface p-12 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No active or historical proposals found.
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((prop) => (
                  <div key={prop.id} className="card-surface p-5 space-y-4 relative overflow-hidden transition-all hover:shadow-md">
                    {/* Badge */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                          style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                          Proposal #{prop.id}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                          {prop.isBondProposal ? "Escrowed Bond Purchase" : "Administrative Action"}
                        </span>
                      </div>
                      <span className={`badge text-xs ${prop.executed ? "badge-success" : prop.approvalsCount >= threshold ? "badge-info animate-pulse" : "badge-warning"}`}>
                        {prop.executed ? "Executed" : prop.approvalsCount >= threshold ? "Awaiting Execution" : "Pending Approvals"}
                      </span>
                    </div>

                    {/* Proposer and details */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p style={{ color: 'var(--muted-foreground)' }}>Proposer</p>
                        <p className="font-mono mt-0.5 font-medium" style={{ color: 'var(--foreground)' }}>
                          {prop.proposer.slice(0, 8)}...{prop.proposer.slice(-6)}
                        </p>
                      </div>
                      {prop.isBondProposal ? (
                        <>
                          <div>
                            <p style={{ color: 'var(--muted-foreground)' }}>Amount Escrowed</p>
                            <p className="font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>
                              {parseFloat(prop.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC
                            </p>
                          </div>
                          <div>
                            <p style={{ color: 'var(--muted-foreground)' }}>Vendor / Term</p>
                            <p className="mt-0.5 font-medium" style={{ color: 'var(--foreground)' }}>
                              {prop.supplier.slice(0, 6)}...{prop.supplier.slice(-4)} (Term #{prop.termId})
                            </p>
                          </div>
                          <div>
                            <p style={{ color: 'var(--muted-foreground)' }}>Refund Mode</p>
                            <p className="mt-0.5 font-medium animate-fade-in" style={{ color: 'var(--foreground)' }}>
                              {prop.swapAtDeposit ? "Swapped immediately" : "Swap at maturity"}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div>
                          <p style={{ color: 'var(--muted-foreground)' }}>Target Contract</p>
                          <p className="font-mono mt-0.5 font-medium" style={{ color: 'var(--foreground)' }}>
                            {prop.targetContract.slice(0, 8)}...{prop.targetContract.slice(-6)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span style={{ color: 'var(--muted-foreground)' }}>Approvals Consensus</span>
                        <span style={{ color: 'var(--foreground)' }}>{prop.approvalsCount} of {threshold} reached</span>
                      </div>
                      <div className="w-full h-1.5 rounded-md overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-md transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (prop.approvalsCount / threshold) * 100)}%`,
                            background: prop.executed ? 'var(--success)' : 'var(--primary)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {!prop.executed && (
                      <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <button
                          onClick={() => handleApprove(prop.id)}
                          disabled={prop.userHasApproved || !isUserAdmin}
                          className="btn-secondary text-xs px-3 py-1.5 gap-1 disabled:opacity-50"
                        >
                          <UserCheck size={12} />
                          {prop.userHasApproved ? "Approved ✓" : "Approve Proposal"}
                        </button>
                        {prop.approvalsCount >= threshold && (
                          <button
                            onClick={() => handleExecute(prop.id)}
                            className="btn-primary text-xs px-3 py-1.5 gap-1"
                          >
                            <Play size={12} />
                            Execute Action
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Config sidebar */}
          <div className="space-y-6">
            <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              Consensus Info
            </h3>

            <div className="card-surface p-5 space-y-4">
              <div className="flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <Shield size={18} />
                <span className="font-bold text-sm">Active Configuration</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Multi-Sig Desk</span>
                  <span className="font-mono font-medium" style={{ color: 'var(--foreground)' }}>
                    {multiSigAddress.slice(0, 6)}...{multiSigAddress.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Required Signs</span>
                  <span className="font-bold" style={{ color: 'var(--foreground)' }}>
                    {threshold} of {adminsList.length} admins
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  Registered Admins:
                </p>
                <div className="space-y-1.5">
                  {adminsList.map((admin, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded font-mono"
                      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                      <span>{admin.slice(0, 8)}...{admin.slice(-6)}</span>
                      {admin.toLowerCase() === address?.toLowerCase() && (
                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                          You
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Administrative Action */}
      {showCreateGenericModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card-surface p-6 max-w-md w-full relative space-y-4 shadow-xl border border-[var(--border)]">
            <button
              onClick={() => setShowCreateGenericModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-[var(--muted)] rounded-lg"
            >
              <X size={16} />
            </button>
            <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              Propose Administrative Action
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  Target Contract
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input-base text-xs font-mono w-full mt-1"
                  value={genericTarget}
                  onChange={(e) => setGenericTarget(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  Function Signature
                </label>
                <input
                  type="text"
                  placeholder="setUpkeepBatchSize(uint256)"
                  className="input-base text-xs font-mono w-full mt-1"
                  value={genericFunctionSignature}
                  onChange={(e) => setGenericFunctionSignature(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  Arguments (Comma Separated JSON Values)
                </label>
                <input
                  type="text"
                  placeholder="50"
                  className="input-base text-xs font-mono w-full mt-1"
                  value={genericArguments}
                  onChange={(e) => setGenericArguments(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleProposeGeneric}
              className="btn-primary w-full text-xs py-2.5 mt-2"
            >
              Propose Action
            </button>
          </div>
        </div>
      )}

      {/* Modal - Bond Purchase */}
      {showCreateBondModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card-surface p-6 max-w-md w-full relative space-y-4 shadow-xl border border-[var(--border)]">
            <button
              onClick={() => setShowCreateBondModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-[var(--muted)] rounded-lg"
            >
              <X size={16} />
            </button>
            <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              Propose Escrowed Bond Purchase
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  placeholder="1000"
                  className="input-base text-xs w-full mt-1"
                  value={bondAmount}
                  onChange={(e) => setBondAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  Term (Term ID)
                </label>
                <input
                  type="number"
                  placeholder="1"
                  className="input-base text-xs w-full mt-1"
                  value={bondTermId}
                  onChange={(e) => setBondTermId(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  Vendor / Supplier Account
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input-base text-xs font-mono w-full mt-1"
                  value={bondSupplier}
                  onChange={(e) => setBondSupplier(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="propose-swap"
                  checked={bondSwapAtDeposit}
                  onChange={(e) => setBondSwapAtDeposit(e.target.checked)}
                  className="rounded border-[var(--border)] accent-[var(--primary)]"
                />
                <label htmlFor="propose-swap" className="text-xs font-semibold select-none cursor-pointer" style={{ color: 'var(--foreground)' }}>
                  Swap EURC immediately at deposit
                </label>
              </div>
            </div>

            <button
              onClick={handleProposeBond}
              className="btn-primary w-full text-xs py-2.5 mt-2"
            >
              Propose Bond Purchase
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
