"use client";

import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract, usePublicClient, useWatchContractEvent, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi, formatUnits, encodeFunctionData } from 'viem';
import { RefreshCw, Download, Clock, CheckCircle2, Loader2, CreditCard, TrendingUp, ArrowUpRight, Wallet, Shield, Info, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import { bundlerClient } from '@/lib/circle-auth';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import KeeperAutomationPanel from './KeeperAutomationPanel';

const VAULT_ADDRESS = "0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" as `0x${string}`;

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

const getTokenSymbol = (addr: string) => {
  if (!addr) return "USDC";
  if (addr.toLowerCase() === USDC_ADDRESS.toLowerCase()) return "USDC";
  if (addr.toLowerCase() === EURC_ADDRESS.toLowerCase()) return "EURC";
  return "USDC";
};

const VAULT_ABI = parseAbi([
  "function nextBondId() view returns (uint256)",
  "function bonds(uint256) view returns (address owner, uint256 principal, uint256 yieldBps, uint256 maturityDate, bool isSettled, uint256 termId, address depositToken, address settlementToken, bool swapAtDeposit, (address supplier, uint32 destDomain, bool isConfigured) intent, address agent, uint256 creationTimestamp, uint8 tranche)",
  "function claimAccruedYield(uint256 _bondId) external",
  "event BondCreated(uint256 indexed bondId, address indexed owner, uint256 maturityDate)"
]);

type Bond = {
  id: number;
  owner: string;
  principal: string;
  yieldBps: number;
  maturityDate: number;
  isSettled: boolean;
  termId: number;
  depositToken: string;
  settlementToken: string;
  swapAtDeposit: boolean;
  supplier: string;
  destDomain: number;
  agent: string;
  creationTimestamp: number;
  tranche: number;
};

// Human-readable transfer method names — no blockchain jargon
const TRANSFER_METHOD_MAP: Record<number, string> = {
  0: "Standard Transfer",
  2: "Priority Transfer",
  3: "Express Transfer",
  6: "Economy Transfer",
  22: "International Transfer"
};

// Status explainer component
function StatusBadge({ bond }: { bond: Bond }) {
  const isMatured = Date.now() >= bond.maturityDate * 1000;
  const lockedAsset = bond.swapAtDeposit ? bond.settlementToken : bond.depositToken;

  if (bond.isSettled) {
    return (
      <div className="group relative inline-block">
        <span className="badge badge-success">
          <span className="w-1.5 h-1.5 rounded-md bg-[var(--success)]"></span>
          Delivered
        </span>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-medium w-48 z-50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ background: 'var(--foreground)', color: 'white' }}>
          Payment has been successfully delivered in {bond.settlementToken} to the vendor's account.
        </div>
      </div>
    );
  }
  
  if (isMatured) {
    return (
      <div className="group relative inline-block">
        <span className="badge badge-warning">
          <span className="w-1.5 h-1.5 rounded-md bg-[var(--warning)] animate-pulse"></span>
          Delivering...
        </span>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-medium w-48 z-50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ background: 'var(--foreground)', color: 'white' }}>
          Due date reached! Payment is being delivered to the vendor right now.
        </div>
      </div>
    );
  }

  return (
    <div className="group relative inline-block">
      <span className="badge badge-info">
        <span className="w-1.5 h-1.5 rounded-md bg-[var(--primary)]"></span>
        Earning Interest
      </span>
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-medium w-48 z-50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: 'var(--foreground)', color: 'white' }}>
        Locked in {lockedAsset} and earning {(bond.yieldBps / 100).toFixed(2)}% APY until maturity.
      </div>
    </div>
  );
}

// Summary stats cards
function SummaryCards({ bonds }: { bonds: Bond[] }) {
  // Aggregate by token type
  const totalHeldUSDC = bonds.filter(b => !b.isSettled && (b.swapAtDeposit ? b.settlementToken : b.depositToken) === 'USDC')
                             .reduce((sum, b) => sum + parseFloat(b.principal), 0);
  const totalHeldEURC = bonds.filter(b => !b.isSettled && (b.swapAtDeposit ? b.settlementToken : b.depositToken) === 'EURC')
                             .reduce((sum, b) => sum + parseFloat(b.principal), 0);

  const activePayments = bonds.filter(b => !b.isSettled).length;
  const deliveredPayments = bonds.filter(b => b.isSettled).length;
  
  const totalInterestUSDC = bonds.filter(b => (b.swapAtDeposit ? b.settlementToken : b.depositToken) === 'USDC')
                                 .reduce((sum, b) => sum + (parseFloat(b.principal) * (b.yieldBps / 10000)), 0);
  const totalInterestEURC = bonds.filter(b => (b.swapAtDeposit ? b.settlementToken : b.depositToken) === 'EURC')
                                 .reduce((sum, b) => sum + (parseFloat(b.principal) * (b.yieldBps / 10000)), 0);

  const stats = [
    { 
      label: "Total held", 
      value: `${totalHeldUSDC.toLocaleString()} USDC`, 
      sublabel: `${totalHeldEURC.toLocaleString()} EURC`,
      icon: <Wallet size={18} />,
      color: 'var(--primary)',
      bg: 'var(--primary-soft)',
    },
    { 
      label: "Active payments", 
      value: activePayments.toString(), 
      sublabel: "Scheduled & earning",
      icon: <Clock size={18} />,
      color: 'var(--info)',
      bg: 'var(--info-soft)',
    },
    { 
      label: "Interest earned (USDC)", 
      value: `+${totalInterestUSDC.toFixed(2)} USDC`, 
      sublabel: "Total projected",
      icon: <TrendingUp size={18} />,
      color: 'var(--success)',
      bg: 'var(--success-soft)',
    },
    { 
      label: "Interest earned (EURC)", 
      value: `+${totalInterestEURC.toFixed(2)} EURC`, 
      sublabel: "Total projected",
      icon: <TrendingUp size={18} />,
      color: 'var(--success)',
      bg: 'var(--success-soft)',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="card-surface p-4 hover:shadow-md transition-all duration-200 animate-fade-in"
          style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
              style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
          </div>
          <p className="text-lg md:text-xl font-bold" style={{ color: 'var(--foreground)' }}>{stat.value}</p>
          <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</p>
          <p className="text-[10px] opacity-75 font-semibold" style={{ color: 'var(--muted-foreground)' }}>{stat.sublabel}</p>
        </div>
      ))}
    </div>
  );
}

// Time remaining helper
function TimeRemaining({ maturityDate }: { maturityDate: number }) {
  const now = Date.now();
  const target = maturityDate * 1000;
  const diff = target - now;

  if (diff <= 0) return <span className="font-medium" style={{ color: 'var(--warning)' }}>Due now</span>;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return <span>{days}d {hours}h remaining</span>;
  return <span>{hours}h remaining</span>;
}

// Tanstack Table Columns Definition
const columns: ColumnDef<Bond>[] = [
  {
    accessorKey: "id",
    header: "Payment",
    cell: ({ row }) => {
      const bond = row.original;
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            #{bond.id}
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            <TimeRemaining maturityDate={bond.maturityDate} />
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "principal",
    header: "Amount Locked",
    cell: ({ row }) => {
      const bond = row.original;
      const lockedAsset = bond.swapAtDeposit ? bond.settlementToken : bond.depositToken;
      return (
        <div>
          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
            {parseFloat(bond.principal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs ml-1 font-bold" style={{ color: 'var(--muted-foreground)' }}>
            {lockedAsset}
          </span>
          {bond.depositToken !== bond.settlementToken && (
            <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {bond.swapAtDeposit ? (
                <span>Swapped from {bond.depositToken}</span>
              ) : (
                <span>Swaps to {bond.settlementToken} at maturity</span>
              )}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "yieldBps",
    header: "Interest Rate",
    cell: ({ row }) => {
      const bond = row.original;
      const lockedAsset = bond.swapAtDeposit ? bond.settlementToken : bond.depositToken;
      const interestEarned = (parseFloat(bond.principal) * (bond.yieldBps / 10000)).toFixed(2);
      return (
        <span className="badge badge-success text-[11px]">
          <TrendingUp size={10} />
          {(bond.yieldBps / 100).toFixed(2)}% · +{interestEarned} {lockedAsset}
        </span>
      );
    },
  },
  {
    accessorKey: "maturityDate",
    header: "Due Date",
    cell: ({ row }) => {
      const dateStr = new Date(row.original.maturityDate * 1000).toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      return <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{dateStr}</span>;
    },
  },
  {
    accessorKey: "supplier",
    header: "Vendor / Network",
    cell: ({ row }) => {
      const bond = row.original;
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
            {TRANSFER_METHOD_MAP[bond.destDomain] || `Transfer #${bond.destDomain}`}
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded w-fit"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            {bond.supplier.slice(0,6)}…{bond.supplier.slice(-4)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "isSettled",
    header: () => <div className="text-right">Status</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right">
          <StatusBadge bond={row.original} />
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row, table }) => {
      const bond = row.original;
      const meta = table.options.meta as any;
      
      if (bond.isSettled) return null;
      
      const isMatured = Date.now() >= bond.maturityDate * 1000;
      if (isMatured) return null;

      const lockedAsset = bond.swapAtDeposit ? bond.settlementToken : bond.depositToken;
      const isWithdrawing = meta?.isWithdrawing;
      
      return (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => meta?.onClaimYield?.(bond.id)}
            disabled={meta?.isClaiming}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: 'var(--success-border)', background: 'var(--success-soft)', color: 'var(--success-foreground)' }}
            id={`btn-claim-yield-${bond.id}`}
          >
            Claim Yield
          </button>
          <button
            onClick={() => meta?.onListOTC?.(bond)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200"
            id={`btn-list-otc-${bond.id}`}
          >
            List on OTC
          </button>
          <button
            onClick={() => meta?.onEarlyWithdraw(bond.id, bond.principal, lockedAsset)}
            disabled={isWithdrawing}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[var(--error-border)] bg-[var(--error-soft)] text-[var(--error-foreground)] hover:bg-[var(--error)] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            id={`btn-early-withdraw-${bond.id}`}
          >
            {isWithdrawing ? "Exiting..." : "Early Exit"}
          </button>
        </div>
      );
    },
  },
];

export default function TreasuryDashboard({ onListOTC }: { onListOTC?: (bond: Bond) => void }) {
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, isSmartAccount } = useCircleAuth();
  const isConnected = isEoaConnected || isSmartAccount;
  const address = isSmartAccount ? circleAccount?.address : eoaAddress;

  const [smartWithdrawPending, setSmartWithdrawPending] = useState(false);
  const publicClient = usePublicClient();
  const [bondsList, setBondsList] = useState<Bond[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: nextBondIdData, refetch } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'nextBondId',
  });

  // Web3 Hooks — Early Withdrawal
  const { data: withdrawHash, writeContract: writeWithdraw, isPending: isWithdrawing } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  const displayIsWithdrawing = isSmartAccount ? smartWithdrawPending : (isWithdrawing || isWithdrawConfirming);

  // Web3 Hooks — Claim Yield
  const { data: claimHash, writeContract: writeClaim, isPending: isClaiming } = useWriteContract();
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({ hash: claimHash });
  const [smartClaimPending, setSmartClaimPending] = useState(false);
  const displayIsClaiming = isSmartAccount ? smartClaimPending : (isClaiming || isClaimConfirming);

  useEffect(() => {
    if (isWithdrawSuccess) {
      toast.success("Early withdrawal completed", {
        description: "Your funds (minus the 2.0% penalty) have been returned to your account.",
        action: withdrawHash ? {
          label: 'View receipt',
          onClick: () => window.open(`https://testnet.arcscan.app/tx/${withdrawHash}`, '_blank')
        } : undefined
      });
      refetch();
    }
  }, [isWithdrawSuccess, withdrawHash, refetch]);

  useEffect(() => {
    if (isClaimSuccess) {
      toast.success("Yield claimed successfully", {
        description: "Your accrued interest has been transferred to your account."
      });
      refetch();
    }
  }, [isClaimSuccess, refetch]);

  const handleEarlyWithdraw = async (bondId: number, principal: string, lockedAsset: string) => {
    const refund = (parseFloat(principal) * 0.98).toFixed(2);
    if (!window.confirm(`Are you sure you want to withdraw Bond #${bondId} early? You will receive your refund of ${refund} ${lockedAsset} (minus a 2.0% early withdrawal penalty).`)) {
      return;
    }
    
    if (isSmartAccount && circleAccount) {
      setSmartWithdrawPending(true);
      try {
        toast.info("Preparing gasless early withdrawal user operation...");
        
        const executeCall = {
          to: VAULT_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: parseAbi(["function earlyWithdraw(uint256 _bondId) external"]),
            functionName: 'earlyWithdraw',
            args: [BigInt(bondId)],
          }),
        };

        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [executeCall],
          paymaster: true,
        });

        toast.info("Transaction sent to bundler. Awaiting on-chain execution...", {
          description: `UserOp Hash: ${userOpHash.slice(0, 10)}...`,
        });

        const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        
        toast.success("Early withdrawal completed", {
          description: "Your funds (minus the 2.0% penalty) have been returned to your account.",
          action: {
            label: 'View receipt',
            onClick: () => window.open(`https://testnet.arcscan.app/tx/${receipt.transactionHash}`, '_blank')
          }
        });
        
        refetch();
      } catch (error: any) {
        console.error("Smart Account Withdraw Error:", error);
        if (error.message?.includes('User rejected') || error.code === 'NotAllowedError' || error.name === 'NotAllowedError') {
          toast.info("Withdrawal cancelled", {
            description: "No funds were moved.",
          });
          return;
        }
        toast.error("Withdrawal failed", {
          description: error.message || "Something went wrong. Please check your transaction and try again.",
        });
      } finally {
        setSmartWithdrawPending(false);
      }
    } else {
      try {
        if (!publicClient || !address) return;
        
        const { request } = await publicClient.simulateContract({
          account: address,
          address: VAULT_ADDRESS,
          abi: parseAbi(["function earlyWithdraw(uint256 _bondId) external"]),
          functionName: 'earlyWithdraw',
          args: [BigInt(bondId)],
        });
        
        writeWithdraw(request);
      } catch (error: any) {
        console.error(error);
        if (error.message?.includes('User rejected') || error.code === 4001 || error.shortMessage?.includes('User rejected')) {
          toast.info("Withdrawal cancelled", {
            description: "No funds were moved.",
          });
          return;
        }
        toast.error("Withdrawal failed", {
          description: error.shortMessage || "Something went wrong. Please check your transaction and try again.",
        });
      }
    }
  };

  const handleClaimYield = async (bondId: number) => {
    if (isSmartAccount && circleAccount) {
      setSmartClaimPending(true);
      try {
        toast.info("Preparing gasless yield claim user operation...");
        
        const executeCall = {
          to: VAULT_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: VAULT_ABI,
            functionName: 'claimAccruedYield',
            args: [BigInt(bondId)],
          }),
        };

        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [executeCall],
          paymaster: true,
        });

        toast.info("Transaction sent to bundler. Awaiting execution...", {
          description: `UserOp Hash: ${userOpHash.slice(0, 10)}...`,
        });

        const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        
        toast.success("Yield claimed successfully", {
          description: "Your streamed interest has been transferred to your smart account.",
          action: {
            label: 'View receipt',
            onClick: () => window.open(`https://testnet.arcscan.app/tx/${receipt.transactionHash}`, '_blank')
          }
        });
        
        refetch();
      } catch (error: any) {
        console.error("Smart Account Claim Error:", error);
        toast.error("Claim failed", {
          description: error.message || "Failed to execute claimAccruedYield."
        });
      } finally {
        setSmartClaimPending(false);
      }
    } else {
      try {
        if (!publicClient || !address) return;
        
        const { request } = await publicClient.simulateContract({
          account: address,
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'claimAccruedYield',
          args: [BigInt(bondId)],
        });
        
        writeClaim(request);
      } catch (error: any) {
        console.error(error);
        toast.error("Claim failed", {
          description: error.shortMessage || error.message || "Failed to submit claim."
        });
      }
    }
  };

  useEffect(() => {
    async function fetchBonds() {
      if (!publicClient || !nextBondIdData || !address) return;
      setIsLoading(true);
      
      try {
        const nextId = Number(nextBondIdData);
        if (nextId === 0) {
          setBondsList([]);
          return;
        }

        const startId = Math.max(1, nextId - 10);
        const calls = [];
        
        for (let i = nextId - 1; i >= startId; i--) {
          calls.push({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'bonds',
            args: [BigInt(i)]
          });
        }

        const results = await publicClient.multicall({ contracts: calls });

        const fetchedBonds: Bond[] = [];
        
        results.forEach((res, index) => {
          if (res.status === 'success' && res.result) {
            const bondData = res.result as any;
            if (bondData[0].toLowerCase() === address.toLowerCase()) {
              fetchedBonds.push({
                id: nextId - 1 - index,
                owner: bondData[0],
                principal: formatUnits(bondData[1], 6),
                yieldBps: Number(bondData[2]),
                maturityDate: Number(bondData[3]),
                isSettled: bondData[4],
                termId: Number(bondData[5]),
                depositToken: getTokenSymbol(bondData[6]),
                settlementToken: getTokenSymbol(bondData[7]),
                swapAtDeposit: bondData[8],
                supplier: bondData[9].supplier,
                destDomain: bondData[9].destDomain,
                agent: bondData[10],
                creationTimestamp: Number(bondData[11]),
                tranche: Number(bondData[12])
              });
            }
          }
        });
        
        setBondsList(fetchedBonds);
      } catch (error) {
        console.error("Failed to load payments:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBonds();
  }, [nextBondIdData, address, publicClient]);

  // Realtime updates
  useWatchContractEvent({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    eventName: 'BondCreated',
    onLogs(logs) {
      console.log('New payment detected — refreshing...', logs);
      refetch();
    },
  });

  const table = useReactTable({
    data: bondsList,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      onEarlyWithdraw: (bondId: number, principal: string, lockedAsset: string) => {
        handleEarlyWithdraw(bondId, principal, lockedAsset);
      },
      onListOTC: (bond: Bond) => {
        onListOTC?.(bond);
      },
      onClaimYield: (bondId: number) => {
        handleClaimYield(bondId);
      },
      isWithdrawing: displayIsWithdrawing,
      isClaiming: displayIsClaiming
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const exportToCSV = () => {
    if (bondsList.length === 0) return;

    // Define CSV headers
    const headers = ["Payment ID", "Locked Amount", "Locked Currency", "Interest Rate (%)", "Due Date", "Vendor Address", "Transfer Method", "Status"];
    
    // Map data to CSV rows
    const rows = bondsList.map(bond => {
      const dateStr = new Date(bond.maturityDate * 1000).toLocaleString();
      const isMatured = Date.now() >= bond.maturityDate * 1000;
      let status = "Earning Interest";
      if (bond.isSettled) status = "Delivered";
      else if (isMatured) status = "Delivering...";

      const lockedAsset = bond.swapAtDeposit ? bond.settlementToken : bond.depositToken;

      return [
        `#${bond.id}`,
        bond.principal,
        lockedAsset,
        (bond.yieldBps / 100).toFixed(1),
        `"${dateStr}"`,
        bond.supplier,
        TRANSFER_METHOD_MAP[bond.destDomain] || `Transfer #${bond.destDomain}`,
        status
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stablepay-payments-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isConnected) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mb-12 animate-fade-in">
      {/* Summary Stats */}
      {bondsList.length > 0 && <SummaryCards bonds={bondsList} />}

      {/* Keeper Automation Status */}
      <KeeperAutomationPanel />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Payment Schedule
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {bondsList.length > 0 
              ? `${bondsList.length} payment${bondsList.length > 1 ? 's' : ''} · Sorted by due date` 
              : 'Your scheduled payments will appear here'}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => refetch()} 
            className="btn-secondary text-xs px-3 py-2 gap-1.5"
            id="btn-refresh"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <button 
            onClick={exportToCSV}
            disabled={bondsList.length === 0}
            className={`btn-secondary text-xs px-3 py-2 gap-1.5 ${bondsList.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            id="btn-export"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>
      
      {/* Payments Table */}
      <div className="card-surface overflow-hidden">
        
        {/* Loading State */}
        {isLoading && bondsList.length === 0 && (
          <div className="px-6 py-16 text-center" style={{ color: 'var(--muted-foreground)' }}>
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>Loading your payments...</p>
                <p className="text-xs mt-1">Connecting to the payment network securely</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Empty State — First-time user education */}
        {!isLoading && bondsList.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-5"
                style={{ background: 'var(--muted)' }}>
                <CreditCard size={28} style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                No payments scheduled yet
              </h3>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                When you schedule your first payment, it will appear here. You'll be able to track 
                the status, see interest earned, and know exactly when each vendor gets paid.
              </p>
              
              {/* Education cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                {[
                  { icon: <Shield size={16} />, title: "Secure", desc: "Funds held safely until due date" },
                  { icon: <TrendingUp size={16} />, title: "Earn APY", desc: "Fixed interest on held funds" },
                  { icon: <CheckCircle2 size={16} />, title: "Auto-pay", desc: "Vendors paid automatically" },
                ].map((card, i) => (
                  <div key={i} className="p-3 rounded-xl" 
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                    <div className="mb-1.5" style={{ color: 'var(--primary)' }}>{card.icon}</div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{card.title}</p>
                    <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Table Powered By Tanstack / Shadcn UI */}
        {bondsList.length > 0 && (
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="text-[11px] uppercase tracking-wider">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, idx) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="animate-fade-in"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Mobile Card View */}
        {bondsList.length > 0 && (
          <div className="md:hidden divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {bondsList.map((bond, idx) => {
              const dateStr = new Date(bond.maturityDate * 1000).toLocaleDateString(undefined, { 
                year: 'numeric', month: 'short', day: 'numeric' 
              });
              const lockedAsset = bond.swapAtDeposit ? bond.settlementToken : bond.depositToken;
              const interestEarned = (parseFloat(bond.principal) * (bond.yieldBps / 10000)).toFixed(2);

              return (
                <div key={bond.id} className="p-4 hover:bg-[var(--muted)]/20 transition-colors animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}>
                  {/* Top Row: Amount + Status */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                          style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                          #{bond.id}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <TimeRemaining maturityDate={bond.maturityDate} />
                        </span>
                      </div>
                      <div className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                        {parseFloat(bond.principal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{lockedAsset}</span>
                      </div>
                    </div>
                    <StatusBadge bond={bond} />
                  </div>
                  
                  {/* Details */}
                  <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: 'var(--muted-foreground)' }}>Due date</span>
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{dateStr}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: 'var(--muted-foreground)' }}>Interest earned</span>
                      <span className="font-semibold" style={{ color: 'var(--success)' }}>+{interestEarned} {lockedAsset} ({(bond.yieldBps / 100).toFixed(2)}%)</span>
                    </div>
                    {bond.depositToken !== bond.settlementToken && (
                      <div className="flex justify-between items-center text-xs">
                        <span style={{ color: 'var(--muted-foreground)' }}>Swap Timing</span>
                        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                          {bond.swapAtDeposit ? `Immediately swapped` : `Swap at maturity`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs pt-2 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                        <ArrowUpRight size={11} />
                        {TRANSFER_METHOD_MAP[bond.destDomain]}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                        {bond.supplier.slice(0,6)}…{bond.supplier.slice(-4)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions (Mobile) */}
                  {!bond.isSettled && Date.now() < bond.maturityDate * 1000 && (
                    <div className="mt-3 flex gap-2 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => handleClaimYield(bond.id)}
                        disabled={displayIsClaiming}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all w-full text-center disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                        style={{ borderColor: 'var(--success-border)', background: 'var(--success-soft)', color: 'var(--success-foreground)' }}
                        id={`btn-claim-yield-mobile-${bond.id}`}
                      >
                        {displayIsClaiming ? "Claiming..." : "Claim Yield"}
                      </button>
                      <button
                        onClick={() => onListOTC?.(bond)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all w-full text-center"
                        id={`btn-list-otc-mobile-${bond.id}`}
                      >
                        List on OTC
                      </button>
                      <button
                        onClick={() => handleEarlyWithdraw(bond.id, bond.principal, lockedAsset)}
                        disabled={displayIsWithdrawing}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--error-border)] bg-[var(--error-soft)] text-[var(--error-foreground)] hover:bg-[var(--error)] hover:text-white transition-all w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        id={`btn-early-withdraw-mobile-${bond.id}`}
                      >
                        {displayIsWithdrawing ? "Exiting..." : "Withdraw Early"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Educational Footer */}
      {bondsList.length > 0 && (
        <div className="mt-6 p-4 rounded-xl flex gap-3 text-xs animate-fade-in"
          style={{ background: 'var(--info-soft)', border: '1px solid var(--info-border)' }}>
          <Info size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />
          <div style={{ color: 'var(--info-foreground)' }}>
            <strong className="font-semibold">How payment statuses work:</strong>
            <span className="ml-1">
              <strong>"Earning Interest"</strong> = your money is safely held and growing. 
              <strong> "Delivering..."</strong> = the due date arrived and payment is being sent. 
              <strong> "Delivered"</strong> = the vendor has received the funds successfully.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
