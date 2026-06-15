"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi, encodeFunctionData } from 'viem';
import { Shield, Settings, Info, Cpu, Play, CheckCircle2, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import { bundlerClient } from '@/lib/circle-auth';

const VAULT_ADDRESS = "0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" as `0x${string}`;

const KEEPER_ABI = parseAbi([
  "function owner() view returns (address)",
  "function authorizedKeeper() view returns (address)",
  "function upkeepBatchSize() view returns (uint256)",
  "function getMaturedUnsettledBonds() view returns (uint256[])",
  "function checkUpkeep(bytes calldata) view returns (bool upkeepNeeded, bytes memory performData)",
  "function performUpkeep(bytes calldata performData) external",
  "function setAuthorizedKeeper(address _keeper) external",
  "function setUpkeepBatchSize(uint256 _batchSize) external"
]);

export default function KeeperAutomationPanel() {
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, isSmartAccount } = useCircleAuth();
  const isConnected = isEoaConnected || isSmartAccount;
  const address = isSmartAccount ? circleAccount?.address : eoaAddress;

  const publicClient = usePublicClient();

  // Settings states
  const [newKeeper, setNewKeeper] = useState("");
  const [newBatchSize, setNewBatchSize] = useState("20");
  const [activeTab, setActiveTab] = useState<'status' | 'settings'>('status');

  // Transactions states
  const [isPendingKeeper, setIsPendingKeeper] = useState(false);
  const [isPendingBatchSize, setIsPendingBatchSize] = useState(false);
  const [isPendingUpkeep, setIsPendingUpkeep] = useState(false);

  // Read Contract Hooks
  const { data: ownerAddress, refetch: refetchOwner } = useReadContract({
    address: VAULT_ADDRESS,
    abi: KEEPER_ABI,
    functionName: 'owner',
  });

  const { data: currentKeeper, refetch: refetchKeeper } = useReadContract({
    address: VAULT_ADDRESS,
    abi: KEEPER_ABI,
    functionName: 'authorizedKeeper',
  });

  const { data: currentBatchSize, refetch: refetchBatchSize } = useReadContract({
    address: VAULT_ADDRESS,
    abi: KEEPER_ABI,
    functionName: 'upkeepBatchSize',
  });

  const { data: maturedUnsettledData, refetch: refetchMatured } = useReadContract({
    address: VAULT_ADDRESS,
    abi: KEEPER_ABI,
    functionName: 'getMaturedUnsettledBonds',
  });

  const isOwner = address && ownerAddress && address.toLowerCase() === (ownerAddress as string).toLowerCase();

  // Write Contract Hooks (EOA Wallet)
  const { writeContract: writeConfig, data: configTxHash } = useWriteContract();
  const { isLoading: isConfigConfirming, isSuccess: isConfigSuccess } = useWaitForTransactionReceipt({ hash: configTxHash });

  useEffect(() => {
    if (isConfigSuccess) {
      toast.success("Keeper configuration updated on-chain ✓");
      refetchKeeper();
      refetchBatchSize();
      setIsPendingKeeper(false);
      setIsPendingBatchSize(false);
    }
  }, [isConfigSuccess, refetchKeeper, refetchBatchSize]);

  // Refresh helper
  const handleRefreshAll = () => {
    refetchOwner();
    refetchKeeper();
    refetchBatchSize();
    refetchMatured();
    toast.info("Refreshed Keeper configurations");
  };

  // Update Authorized Keeper
  const handleUpdateKeeper = async () => {
    if (!newKeeper) {
      toast.error("Please enter a valid keeper address");
      return;
    }
    
    if (isSmartAccount && circleAccount) {
      setIsPendingKeeper(true);
      try {
        toast.info("Sending gasless keeper update user operation...");
        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [{
            to: VAULT_ADDRESS,
            value: BigInt(0),
            data: encodeFunctionData({
              abi: KEEPER_ABI,
              functionName: 'setAuthorizedKeeper',
              args: [newKeeper as `0x${string}`],
            }),
          }],
          paymaster: true,
        });
        toast.info("Awaiting smart account keeper update confirmation...");
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        toast.success("Authorized keeper updated successfully!");
        refetchKeeper();
      } catch (err: any) {
        toast.error("Keeper update failed", { description: err.message });
      } finally {
        setIsPendingKeeper(false);
      }
    } else {
      try {
        writeConfig({
          address: VAULT_ADDRESS,
          abi: KEEPER_ABI,
          functionName: 'setAuthorizedKeeper',
          args: [newKeeper as `0x${string}`],
        });
        setIsPendingKeeper(true);
      } catch (err: any) {
        toast.error("Transaction initiation failed", { description: err.message });
      }
    }
  };

  // Update Upkeep Batch Size
  const handleUpdateBatchSize = async () => {
    const size = parseInt(newBatchSize);
    if (isNaN(size) || size < 1 || size > 50) {
      toast.error("Batch size must be between 1 and 50");
      return;
    }

    if (isSmartAccount && circleAccount) {
      setIsPendingBatchSize(true);
      try {
        toast.info("Sending gasless batch size update user operation...");
        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [{
            to: VAULT_ADDRESS,
            value: BigInt(0),
            data: encodeFunctionData({
              abi: KEEPER_ABI,
              functionName: 'setUpkeepBatchSize',
              args: [BigInt(size)],
            }),
          }],
          paymaster: true,
        });
        toast.info("Awaiting smart account batch size confirmation...");
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        toast.success("Upkeep batch size updated successfully!");
        refetchBatchSize();
      } catch (err: any) {
        toast.error("Batch size update failed", { description: err.message });
      } finally {
        setIsPendingBatchSize(false);
      }
    } else {
      try {
        writeConfig({
          address: VAULT_ADDRESS,
          abi: KEEPER_ABI,
          functionName: 'setUpkeepBatchSize',
          args: [BigInt(size)],
        });
        setIsPendingBatchSize(true);
      } catch (err: any) {
        toast.error("Transaction initiation failed", { description: err.message });
      }
    }
  };

  // Force Manual Upkeep Execution (Perform Upkeep)
  const handleManualUpkeep = async () => {
    if (!maturedUnsettledData || (maturedUnsettledData as any[]).length === 0) {
      toast.error("No matured bonds pending in keeper queue");
      return;
    }

    const pendingIds = maturedUnsettledData as bigint[];
    
    // Simulate checkUpkeep to encode performData correctly
    // The performData is abi-encoded array of uint256
    const performData = encodeFunctionData({
      abi: parseAbi(["function performUpkeep(bytes calldata performData) external"]),
      functionName: 'performUpkeep',
      args: ['0x'] // Temp parameter we override manually below
    });
    
    // Custom manual encoding of performData (uint256[])
    const defaultAbiCoder = encodeFunctionData({
      abi: parseAbi(["function test(uint256[] memory ids) external"]),
      functionName: 'test',
      args: [pendingIds],
    });
    
    // Extract the raw uint256[] bytes payload
    const rawPayload = '0x' + defaultAbiCoder.slice(10);

    if (isSmartAccount && circleAccount) {
      setIsPendingUpkeep(true);
      try {
        toast.info("Triggering gasless manual keeper run...");
        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [{
            to: VAULT_ADDRESS,
            value: BigInt(0),
            data: encodeFunctionData({
              abi: KEEPER_ABI,
              functionName: 'performUpkeep',
              args: [rawPayload as `0x${string}`],
            }),
          }],
          paymaster: true,
        });
        toast.info("Keeper execution pending in bundler...");
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        toast.success("Manual upkeep execution completed successfully ✓");
        refetchMatured();
      } catch (err: any) {
        toast.error("Keeper execution failed", { description: err.message });
      } finally {
        setIsPendingUpkeep(false);
      }
    } else {
      try {
        toast.info("Please approve the keeper execution transaction...");
        writeConfig({
          address: VAULT_ADDRESS,
          abi: KEEPER_ABI,
          functionName: 'performUpkeep',
          args: [rawPayload as `0x${string}`],
        });
        setIsPendingUpkeep(true);
      } catch (err: any) {
        toast.error("Transaction failed", { description: err.message });
      }
    }
  };

  const pendingBondsCount = maturedUnsettledData ? (maturedUnsettledData as any[]).length : 0;
  const isKeeperDisabled = currentKeeper && currentKeeper !== "0x0000000000000000000000000000000000000000";

  if (!isConnected) return null;

  return (
    <div className="card-surface overflow-hidden p-5 md:p-6 mb-8 relative border" style={{ borderColor: 'var(--border)' }}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary)] opacity-5 rounded-bl-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b mb-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)] shrink-0">
            <Cpu size={20} className={pendingBondsCount > 0 ? "animate-pulse" : ""} />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              Decentralized Keeper Settlement
              <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md ${
                pendingBondsCount > 0 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {pendingBondsCount > 0 ? 'Upkeep Required' : 'Active & Earmarked'}
              </span>
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Powered by Chainlink Automation and Gelato Resolvers to settle matured corporate cash flows.
            </p>
          </div>
        </div>

        {/* Tab Selector / Admin Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--muted)] p-1 rounded-lg border text-xs font-semibold" style={{ borderColor: 'var(--border)' }}>
            <button 
              onClick={() => setActiveTab('status')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'status' 
                  ? 'bg-[var(--canvas)] shadow-xs' 
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Monitor
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'settings' 
                  ? 'bg-[var(--canvas)] shadow-xs' 
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Settings size={12} />
              Config
            </button>
          </div>
          <button 
            onClick={handleRefreshAll}
            className="p-2 border rounded-lg hover:bg-[var(--muted)]/50 transition-colors text-[var(--muted-foreground)]"
            title="Refresh Registry"
          >
            <Loader2 size={14} className={isPendingKeeper || isPendingBatchSize || isPendingUpkeep ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {activeTab === 'status' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Automation Status Panel */}
          <div className="bg-[var(--muted)]/40 p-4 rounded-xl border flex flex-col justify-between" style={{ borderColor: 'var(--border)' }}>
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>
                <Cpu size={12} />
                Automation Node
              </div>
              <p className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                {isKeeperDisabled ? 'Restricted Node Forwarder' : 'Permissionless Resolvers'}
              </p>
              <p className="text-[10px] mt-1 break-all font-mono" style={{ color: 'var(--muted-foreground)' }}>
                {currentKeeper && currentKeeper !== "0x0000000000000000000000000000000000000000" 
                  ? (currentKeeper as string) 
                  : 'Open (Any Keeper Node Allowed)'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Automation APY</span>
              <span className="font-bold text-emerald-600">100% On-Time</span>
            </div>
          </div>

          {/* Upkeep Queue Panel */}
          <div className="bg-[var(--muted)]/40 p-4 rounded-xl border flex flex-col justify-between" style={{ borderColor: 'var(--border)' }}>
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>
                <Info size={12} />
                Maturity Queue
              </div>
              <p className="font-semibold text-2xl" style={{ color: 'var(--foreground)' }}>
                {pendingBondsCount}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Matured payments awaiting keeper execution.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Batch Limit</span>
              <span className="font-bold">{currentBatchSize ? (currentBatchSize as bigint).toString() : '20'} bonds</span>
            </div>
          </div>

          {/* Action trigger Panel */}
          <div className="p-4 rounded-xl border flex flex-col justify-between" 
            style={{ 
              borderColor: pendingBondsCount > 0 ? 'var(--warning-border)' : 'var(--border)',
              background: pendingBondsCount > 0 ? 'var(--warning-soft)' : 'var(--muted)/10' 
            }}>
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: pendingBondsCount > 0 ? 'var(--warning-foreground)' : 'var(--muted-foreground)' }}>
                {pendingBondsCount > 0 ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                Execution Status
              </div>
              <h4 className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                {pendingBondsCount > 0 ? 'Keeper Trigger Required' : 'All Settled Cleanly'}
              </h4>
              <p className="text-[11px] mt-1 leading-normal" style={{ color: 'var(--muted-foreground)' }}>
                {pendingBondsCount > 0 
                  ? 'Bonds have reached maturity. Trigger an immediate keeper settlement batch now to bypass automation latency.' 
                  : 'Chainlink Automation is listening for matured bonds. No pending settlements in queue.'}
              </p>
            </div>

            <button
              onClick={handleManualUpkeep}
              disabled={pendingBondsCount === 0 || isPendingUpkeep}
              className={`w-full text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 mt-3 transition-colors ${
                pendingBondsCount > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-white font-bold'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
              }`}
            >
              {isPendingUpkeep ? (
                <><Loader2 size={13} className="animate-spin" /> Batching...</>
              ) : (
                <><Play size={13} /> Settle Matured Queue</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Update Authorized Keeper Node */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--foreground)' }}>
                Authorized Automation Registry / Forwarder
              </label>
              <p className="text-[11px] mb-2" style={{ color: 'var(--muted-foreground)' }}>
                Restricts keeper calls strictly to this forwarder contract (e.g. Chainlink Automation Registry). Set to zero-address for permissionless Gelato networks.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x... (or Zero Address for open keeper access)"
                  value={newKeeper}
                  onChange={(e) => setNewKeeper(e.target.value)}
                  className="input-field text-xs font-mono py-2 flex-1"
                />
                <button
                  onClick={handleUpdateKeeper}
                  disabled={isPendingKeeper || !isOwner}
                  className="btn-primary text-xs px-4 py-2 font-semibold justify-center min-w-[80px]"
                >
                  {isPendingKeeper ? <Loader2 size={13} className="animate-spin" /> : 'Set'}
                </button>
              </div>
            </div>
          </div>

          {/* Update Batch Settlement Size */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--foreground)' }}>
                Upkeep Max Batch Size
              </label>
              <p className="text-[11px] mb-2" style={{ color: 'var(--muted-foreground)' }}>
                Restricts the maximum number of settled bonds in a single keeper invocation to protect from out-of-gas errors.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="20"
                  min="1"
                  max="50"
                  value={newBatchSize}
                  onChange={(e) => setNewBatchSize(e.target.value)}
                  className="input-field text-xs py-2 flex-1"
                />
                <button
                  onClick={handleUpdateBatchSize}
                  disabled={isPendingBatchSize || !isOwner}
                  className="btn-primary text-xs px-4 py-2 font-semibold justify-center min-w-[80px]"
                >
                  {isPendingBatchSize ? <Loader2 size={13} className="animate-spin" /> : 'Set'}
                </button>
              </div>
            </div>
          </div>

          {!isOwner && (
            <div className="col-span-1 md:col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
              <Shield size={14} className="text-amber-600 mt-0.5" />
              <div className="text-[11px] text-amber-800">
                <span className="font-bold">Owner Permissions Required:</span> You can view configurations, but only the contract owner address ({ownerAddress ? `${(ownerAddress as string).slice(0, 10)}...` : 'Vault owner'}) is authorized to update registry addresses and batch limits.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
