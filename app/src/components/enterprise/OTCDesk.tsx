"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useReadContract, usePublicClient, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from 'wagmi';
import { parseAbi, formatUnits, parseUnits, encodeFunctionData } from 'viem';
import { RefreshCw, Tag, ShieldAlert, BadgeAlert, ArrowUpRight, TrendingUp, Info, CheckCircle2, XCircle, ChevronRight, HelpCircle, Loader2, Sparkles, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import { bundlerClient } from '@/lib/circle-auth';

const VAULT_ADDRESS = "0x4610ba85Ff3b7993d9f5b2CB5DE4cf194a451942" as `0x${string}`;
const OTC_ADDRESS = "0x9E7cF55e889B6C9457Ce3a4E0e4fd2f73f95B091" as `0x${string}`;

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;
const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as `0x${string}`;

const VAULT_ABI = parseAbi([
  "function nextBondId() view returns (uint256)",
  "function bonds(uint256) view returns (address owner, uint256 principal, uint256 yieldBps, uint256 maturityDate, bool isSettled, uint256 termId, address depositToken, address settlementToken, bool swapAtDeposit, address supplier, uint32 destDomain, bool isConfigured, address agent, uint256 creationTimestamp, uint8 tranche)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  "function setApprovalForAll(address operator, bool approved) external"
]);

const OTC_ABI = parseAbi([
  "function orders(uint256) view returns (uint256 orderId, uint256 bondId, address seller, uint256 price, bool isActive)",
  "function bondToActiveOrder(uint256) view returns (uint256)",
  "function nextOrderId() view returns (uint256)",
  "function listBondForSale(uint256 _bondId, uint256 _price) external",
  "function cancelOrder(uint256 _orderId) external",
  "function fillOrder(uint256 _orderId) external"
]);

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
]);

type Bond = {
  id: number;
  owner: string;
  principal: number;
  yieldBps: number;
  maturityDate: number;
  isSettled: boolean;
  termId: number;
  depositToken: string;
  settlementToken: string;
  swapAtDeposit: boolean;
};

type Order = {
  orderId: number;
  bondId: number;
  seller: string;
  price: number; // in USDC
  isActive: boolean;
  bond?: Bond;
};

const getTokenSymbol = (addr: string) => {
  if (!addr) return "USDC";
  if (addr.toLowerCase() === USDC_ADDRESS.toLowerCase()) return "USDC";
  if (addr.toLowerCase() === EURC_ADDRESS.toLowerCase()) return "EURC";
  return "USDC";
};

// Map term ID to duration in days
const TERM_DURATIONS: Record<number, number> = {
  1: 30,
  2: 60,
  3: 90,
  4: 180,
  5: 365
};

// Tooltip Component — contextual helper
function Tooltip({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors cursor-pointer"
        aria-label="More info"
      >
        <HelpCircle size={13} />
      </button>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-medium leading-snug w-56 z-50 shadow-lg animate-fade-in text-left font-sans"
          style={{ 
            background: 'var(--foreground)', 
            color: 'var(--primary-foreground)' 
          }}>
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 -mt-1"
            style={{ background: 'var(--foreground)' }}></div>
        </div>
      )}
    </span>
  );
}

export default function OTCDesk() {
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, isSmartAccount } = useCircleAuth();
  const isConnected = isEoaConnected || isSmartAccount;
  const address = isSmartAccount ? circleAccount?.address : eoaAddress;

  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userBonds, setUserBonds] = useState<Bond[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  // Listing modal state
  const [selectedBondForList, setSelectedBondForList] = useState<Bond | null>(null);
  const [listPrice, setListPrice] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // No mock data — all data is fetched from on-chain contracts

  // Read Vault data
  const { data: nextBondIdData, refetch: refetchNextBond } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'nextBondId'
  });

  // Read OTC data
  const { data: nextOrderIdData, refetch: refetchNextOrder } = useReadContract({
    address: OTC_ADDRESS,
    abi: OTC_ABI,
    functionName: 'nextOrderId'
  });

  const fetchData = async () => {
    if (!publicClient || !address) return;
    setIsLoading(true);

    try {
      // Fetch the latest next IDs directly from on-chain to bypass hook cache/delays
      const [onChainNextBondId, onChainNextOrderId] = await Promise.all([
        publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'nextBondId'
        }),
        publicClient.readContract({
          address: OTC_ADDRESS,
          abi: OTC_ABI,
          functionName: 'nextOrderId'
        })
      ]);

      const nextBondId = Number(onChainNextBondId);
      const nextOrderId = Number(onChainNextOrderId);

      // Parallelize the initial multicalls for reading balances and orders list
      const balanceCalls = [];
      for (let i = 0; i < nextBondId; i++) {
        balanceCalls.push({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`, BigInt(i)]
        });
      }

      const orderCalls = [];
      for (let i = 0; i < nextOrderId; i++) {
        orderCalls.push({
          address: OTC_ADDRESS,
          abi: OTC_ABI,
          functionName: 'orders',
          args: [BigInt(i)]
        });
      }

      // Dispatch parallel requests
      const [balances, fetchedOrders] = await Promise.all([
        nextBondId > 0 ? publicClient.multicall({ contracts: balanceCalls }) : Promise.resolve([]),
        nextOrderId > 0 ? publicClient.multicall({ contracts: orderCalls }) : Promise.resolve([])
      ]);

      const userBondsTemp: Bond[] = [];
      const fetchBondDetailsCalls: any[] = [];
      const ownedBondIds: number[] = [];

      balances.forEach((res, idx) => {
        if (res.status === 'success' && Number(res.result) > 0) {
          ownedBondIds.push(idx);
          fetchBondDetailsCalls.push({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'bonds',
            args: [BigInt(idx)]
          });
        }
      });

      const activeOrdersTemp: Order[] = [];
      const bondDetailsCallsForOrders: any[] = [];

      fetchedOrders.forEach((res) => {
        if (res.status === 'success' && res.result) {
          const ord = res.result as any;
          const orderId = Number(ord[0]);
          const bondId = Number(ord[1]);
          const seller = ord[2];
          const price = parseFloat(formatUnits(ord[3], 6));
          const isActive = ord[4];

          if (isActive && seller !== '0x0000000000000000000000000000000000000000') {
            activeOrdersTemp.push({
              orderId,
              bondId,
              seller,
              price,
              isActive
            });
            bondDetailsCallsForOrders.push({
              address: VAULT_ADDRESS,
              abi: VAULT_ABI,
              functionName: 'bonds',
              args: [BigInt(bondId)]
            });
          }
        }
      });

      // Parallelize the second step: details fetching
      const [details, bondsResult] = await Promise.all([
        fetchBondDetailsCalls.length > 0 ? publicClient.multicall({ contracts: fetchBondDetailsCalls }) : Promise.resolve([]),
        bondDetailsCallsForOrders.length > 0 ? publicClient.multicall({ contracts: bondDetailsCallsForOrders }) : Promise.resolve([])
      ]);

      // Parse user bonds details
      details.forEach((res, idx) => {
        if (res.status === 'success' && res.result) {
          const bondData = res.result as any;
          userBondsTemp.push({
            id: ownedBondIds[idx],
            owner: bondData[0],
            principal: parseFloat(formatUnits(bondData[1], 6)),
            yieldBps: Number(bondData[2]),
            maturityDate: Number(bondData[3]),
            isSettled: bondData[4],
            termId: Number(bondData[5]),
            depositToken: getTokenSymbol(bondData[6]),
            settlementToken: getTokenSymbol(bondData[7]),
            swapAtDeposit: bondData[8]
          });
        }
      });

      // Parse order bonds details
      bondsResult.forEach((res, index) => {
        if (res.status === 'success' && res.result) {
          const bondData = res.result as any;
          activeOrdersTemp[index].bond = {
            id: activeOrdersTemp[index].bondId,
            owner: bondData[0],
            principal: parseFloat(formatUnits(bondData[1], 6)),
            yieldBps: Number(bondData[2]),
            maturityDate: Number(bondData[3]),
            isSettled: bondData[4],
            termId: Number(bondData[5]),
            depositToken: getTokenSymbol(bondData[6]),
            settlementToken: getTokenSymbol(bondData[7]),
            swapAtDeposit: bondData[8]
          };
        }
      });

      setUserBonds(userBondsTemp);
      setOrders(activeOrdersTemp);
      refetchNextBond();
      refetchNextOrder();
    } catch (err) {
      console.error("Error loading OTC data:", err);
      setOrders([]);
      setUserBonds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [address, nextBondIdData, nextOrderIdData, publicClient]);

  // Check approval state for listing modal
  useEffect(() => {
    async function checkApproval() {
      if (!publicClient || !address || !selectedBondForList) return;
      try {
        const approved = await publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'isApprovedForAll',
          args: [address as `0x${string}`, OTC_ADDRESS]
        });
        setIsApproved(approved);
      } catch (e) {
        setIsApproved(false);
      }
    }
    checkApproval();
  }, [selectedBondForList, address, publicClient]);

  // Calculate YTM
  const calculateYTM = (bond: Bond, purchasePrice: number) => {
    const daysToMaturity = Math.max(1, Math.ceil((bond.maturityDate - Date.now() / 1000) / (24 * 60 * 60)));
    const duration = TERM_DURATIONS[bond.termId] || 30;
    
    // Total interest yield at maturity
    const totalYield = bond.principal * (bond.yieldBps / 10000) * (duration / 365);
    const totalReturnAtMaturity = bond.principal + totalYield;

    // YTM = ((Total Return - Purchase Price) / Purchase Price) * (365 / Days to Maturity) * 100
    const ytm = ((totalReturnAtMaturity - purchasePrice) / purchasePrice) * (365 / daysToMaturity) * 100;
    return {
      ytm: Math.max(-100, ytm),
      daysToMaturity,
      totalYield
    };
  };

  const handleApproveAll = async () => {
    setIsActionPending(true);
    const toastId = toast.loading("Approving OTC contract to manage your bonds...");

    if (isSmartAccount && circleAccount) {
      try {
        const txData = {
          to: VAULT_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: VAULT_ABI,
            functionName: 'setApprovalForAll',
            args: [OTC_ADDRESS, true]
          })
        };
        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [txData],
          paymaster: true
        });
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        setIsApproved(true);
        toast.success("OTC contract approved successfully!", { id: toastId });
      } catch (err: any) {
        toast.error(`Approval failed: ${err.message || err}`, { id: toastId });
      } finally {
        setIsActionPending(false);
      }
    } else {
      try {
        toast.info("Please sign the approval transaction in your wallet", { id: toastId });
        const hash = await writeContractAsync({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'setApprovalForAll',
          args: [OTC_ADDRESS, true]
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        setIsApproved(true);
        toast.success("OTC contract approved!", { id: toastId });
      } catch (err: any) {
        toast.error(`Approval failed: ${err.message}`, { id: toastId });
      } finally {
        setIsActionPending(false);
      }
    }
  };

  const handleListOrder = async () => {
    if (!selectedBondForList || !listPrice) return;
    const priceNum = parseFloat(listPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsActionPending(true);
    const toastId = toast.loading(`Listing Bond #${selectedBondForList.id} for ${priceNum} USDC...`);

    if (isSmartAccount && circleAccount) {
      try {
        const txData = {
          to: OTC_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: OTC_ABI,
            functionName: 'listBondForSale',
            args: [BigInt(selectedBondForList.id), parseUnits(listPrice, 6)]
          })
        };
        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [txData],
          paymaster: true
        });
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        toast.success("Bond listed on OTC Desk!", { id: toastId });
        setSelectedBondForList(null);
        setListPrice("");
        fetchData();
      } catch (err: any) {
        toast.error(`Listing failed: ${err.message || err}`, { id: toastId });
      } finally {
        setIsActionPending(false);
      }
    } else {
      try {
        toast.info("Please sign the listing transaction in your wallet", { id: toastId });
        const hash = await writeContractAsync({
          address: OTC_ADDRESS,
          abi: OTC_ABI,
          functionName: 'listBondForSale',
          args: [BigInt(selectedBondForList.id), parseUnits(listPrice, 6)]
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        toast.success("Bond listed on OTC Desk!", { id: toastId });
        setSelectedBondForList(null);
        setListPrice("");
        fetchData();
      } catch (err: any) {
        toast.error(`Listing failed: ${err.message || err}`, { id: toastId });
      } finally {
        setIsActionPending(false);
      }
    }
  };

  const handleCancelOrder = async (orderId: number, bondId: number) => {
    setIsActionPending(true);
    const toastId = toast.loading(`Cancelling Order #${orderId}...`);

    if (isSmartAccount && circleAccount) {
      try {
        const txData = {
          to: OTC_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: OTC_ABI,
            functionName: 'cancelOrder',
            args: [BigInt(orderId)]
          })
        };
        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [txData],
          paymaster: true
        });
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        toast.success("Order cancelled, bond returned to wallet", { id: toastId });
        fetchData();
      } catch (err: any) {
        toast.error(`Cancellation failed: ${err.message || err}`, { id: toastId });
      } finally {
        setIsActionPending(false);
      }
    } else {
      try {
        toast.info("Please sign the cancellation transaction in your wallet", { id: toastId });
        const hash = await writeContractAsync({
          address: OTC_ADDRESS,
          abi: OTC_ABI,
          functionName: 'cancelOrder',
          args: [BigInt(orderId)]
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        toast.success("Order cancelled, bond returned to wallet", { id: toastId });
        fetchData();
      } catch (err: any) {
        toast.error(`Cancellation failed: ${err.message || err}`, { id: toastId });
      } finally {
        setIsActionPending(false);
      }
    }
  };

  const handleFillOrder = async (order: Order) => {
    setIsActionPending(true);
    const toastId = toast.loading(`Purchasing Bond #${order.bondId} for ${order.price} USDC...`);

    if (isSmartAccount && circleAccount) {
      try {
        // Approve USDC spend
        const approveCall = {
          to: USDC_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [OTC_ADDRESS, parseUnits(order.price.toString(), 6)]
          })
        };

        // Fill Order call
        const fillCall = {
          to: OTC_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: OTC_ABI,
            functionName: 'fillOrder',
            args: [BigInt(order.orderId)]
          })
        };

        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [approveCall, fillCall],
          paymaster: true
        });
        await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        toast.success("Bond purchased successfully!", { id: toastId });
        fetchData();
      } catch (err: any) {
        toast.error(`Purchase failed: ${err.message || err}`, { id: toastId });
      } finally {
        setIsActionPending(false);
      }
    } else {
      try {
        // Step 1: Approve USDC spend for OTC contract
        toast.info("Step 1/2: Please approve USDC spend...", { id: toastId });
        const approveHash = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [OTC_ADDRESS, parseUnits(order.price.toString(), 6)]
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        // Step 2: Fill the order
        toast.info("Step 2/2: Please sign the purchase transaction...", { id: toastId });
        const fillHash = await writeContractAsync({
          address: OTC_ADDRESS,
          abi: OTC_ABI,
          functionName: 'fillOrder',
          args: [BigInt(order.orderId)]
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: fillHash });
        }
        toast.success("Bond purchased successfully!", { id: toastId });
        fetchData();
      } catch (err: any) {
        toast.error(`Purchase failed: ${err.message || err}`, { id: toastId });
      } finally {
        setIsActionPending(false);
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
      {/* Overview and Info Panel */}
      <div className="card-surface p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-[var(--primary-soft)] to-transparent opacity-40 pointer-events-none rounded-md translate-x-12 -translate-y-12"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="badge badge-primary text-xs font-semibold px-2 py-1">
              <Sparkles size={11} className="mr-1" />
              Secondary Liquidity Desk
            </span>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Over-the-Counter (OTC) Market</h2>
            <p className="text-sm text-[var(--muted-foreground)] max-w-xl leading-relaxed">
              Whitelisted corporations can list their active bond positions for sale or purchase seasoned bonds at a discount. Liquidate positions instantly without paying protocol penalties, or capture elevated Yield-to-Maturity (YTM) rates.
            </p>
          </div>
          <button 
            onClick={fetchData} 
            disabled={isLoading}
            className="btn-secondary h-10 w-fit shrink-0 self-start md:self-center gap-2"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Sync Market
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Elevated YTM</h4>
              <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">Capture up to 8%+ yields</p>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">By purchasing seasoned bonds listed at a discount.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Tag size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">0% Exit Penalty</h4>
              <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">Zero penalty liquidation</p>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Sellers choose their own pricing without early exit costs.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--info-soft)] text-[var(--info)] flex items-center justify-center shrink-0">
              <Receipt size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Low Trading Fee</h4>
              <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">Flat 0.20% protocol fee</p>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Charged automatically to the seller upon a completed sale.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column: Available Market Listings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
              <span>Market Listings</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--muted)] text-[var(--muted-foreground)]">
                {orders.length} active
              </span>
            </h3>
          </div>

          {isLoading ? (
            <div className="card-surface p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
              <p className="text-sm text-[var(--muted-foreground)]">Retrieving active OTC order book...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="card-surface p-12 text-center flex flex-col items-center justify-center gap-3">
              <Tag className="text-[var(--muted-foreground)] opacity-50" size={36} />
              <h4 className="font-semibold text-[var(--foreground)]">No Bonds Listed For Sale</h4>
              <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
                There are currently no active sell orders. You can list one of your own active bonds below.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                if (!order.bond) return null;
                const { ytm, daysToMaturity, totalYield } = calculateYTM(order.bond, order.price);
                const discount = ((order.bond.principal - order.price) / order.bond.principal) * 100;
                const isMyListing = address && order.seller.toLowerCase() === address.toLowerCase();

                return (
                  <div 
                    key={order.orderId}
                    className="card-surface p-5 hover:border-[var(--primary)] transition-all duration-300 relative group"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Left: Bond Principal & Stats */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                            Order #{order.orderId}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            Bond #{order.bondId}
                          </span>
                        </div>
                        <div className="text-xl font-semibold text-[var(--foreground)]">
                          {order.bond.principal.toLocaleString()} <span className="text-xs font-semibold text-[var(--muted-foreground)]">{order.bond.depositToken}</span>
                          <span className="text-xs font-normal text-[var(--muted-foreground)] ml-2">Face Value</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                          <span>Maturity Yield: <strong className="text-[var(--success)]">+{(order.bond.yieldBps / 100).toFixed(2)}% APY</strong></span>
                          <span>•</span>
                          <span>Due: <strong>{new Date(order.bond.maturityDate * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong> ({daysToMaturity} days remaining)</span>
                        </div>
                      </div>

                      {/* Middle: YTM & Price calculations */}
                      <div className="flex gap-6 sm:gap-8 items-center self-stretch sm:self-auto sm:border-l pl-0 sm:pl-6 border-[var(--border)] shrink-0 justify-between sm:justify-start">
                        <div className="text-left min-w-[100px] shrink-0">
                          <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1 whitespace-nowrap">
                            Buyer's YTM
                            <Tooltip text="Yield-to-Maturity (YTM) measures the annualized yield a buyer captures by buying this bond at the current listing price." />
                          </div>
                          <div className="text-base font-bold text-[var(--success)] flex items-center gap-1 mt-1 whitespace-nowrap">
                            <TrendingUp size={14} className="shrink-0" />
                            {ytm.toFixed(2)}%
                          </div>
                          {discount > 0 && (
                            <div className="mt-1">
                              <span className="text-[9px] font-semibold text-[var(--success)] bg-[var(--success-soft)] px-1.5 py-0.5 rounded whitespace-nowrap">
                                {discount.toFixed(1)}% Discount
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right sm:text-left min-w-[110px] shrink-0">
                          <div className="text-[11px] text-[var(--muted-foreground)] whitespace-nowrap">Asking Price</div>
                          <div className="text-base font-bold text-[var(--foreground)] mt-1 whitespace-nowrap">
                            {order.price.toLocaleString()} <span className="text-xs font-semibold text-[var(--muted-foreground)]">USDC</span>
                          </div>
                          <div className="text-[10px] text-[var(--muted-foreground)] mt-1 whitespace-nowrap font-mono">
                            Seller: {order.seller.slice(0,6)}…{order.seller.slice(-4)}
                          </div>
                        </div>
                      </div>

                      {/* Right: Buy/Cancel Action */}
                      <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                        {isMyListing ? (
                          <button
                            onClick={() => handleCancelOrder(order.orderId, order.bondId)}
                            disabled={isActionPending}
                            className="btn-secondary hover:border-[var(--error-border)] hover:bg-[var(--error-soft)] hover:text-[var(--error-foreground)] w-full sm:w-fit font-semibold"
                          >
                            Cancel Listing
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFillOrder(order)}
                            disabled={isActionPending}
                            className="btn-primary w-full sm:w-fit font-semibold gap-1.5"
                          >
                            Buy Bond
                            <ArrowUpRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: User's Active Bonds & Listing Panel */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-[var(--foreground)]">Your Tokenized Bonds</h3>

          {userBonds.length === 0 ? (
            <div className="card-surface p-6 text-center space-y-2">
              <ShieldAlert className="mx-auto text-[var(--muted-foreground)]" size={28} />
              <h4 className="font-semibold text-xs text-[var(--foreground)]">No Sellable Bonds</h4>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                You do not own any active tokenized bonds. Create new bonds on the main page to populate your list.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userBonds.map((bond) => {
                const daysToMaturity = Math.max(1, Math.ceil((bond.maturityDate - Date.now() / 1000) / (24 * 60 * 60)));
                return (
                  <div 
                    key={bond.id} 
                    className="card-surface p-4 border border-[var(--border)] hover:border-[var(--primary)] transition-all cursor-default"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-semibold text-[var(--muted-foreground)]">
                          Bond ID: #{bond.id}
                        </div>
                        <div className="font-bold text-base text-[var(--foreground)] mt-0.5">
                          {bond.principal.toLocaleString()} {bond.depositToken}
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)] mt-1">
                          Rate: <strong>{(bond.yieldBps / 100).toFixed(2)}% APY</strong>
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)]">
                          Matures: <strong>{new Date(bond.maturityDate * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</strong> ({daysToMaturity}d)
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedBondForList(bond)}
                        className="btn-primary text-xs py-1 px-3 h-8 font-semibold shrink-0"
                      >
                        List for Sale
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Listing Modal */}
      {selectedBondForList && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card-surface p-6 max-w-md w-full relative space-y-4 shadow-xl border border-[var(--border)]">
            <button
              onClick={() => setSelectedBondForList(null)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-semibold"
            >
              Close ✕
            </button>

            <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
              <Tag size={18} className="text-[var(--primary)]" />
              List Bond #{selectedBondForList.id} on OTC Desk
            </h3>

            {/* Bond details */}
            <div className="rounded-xl p-3 bg-[var(--muted)] space-y-2 border">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Face Value:</span>
                <span className="font-bold text-[var(--foreground)]">{selectedBondForList.principal.toLocaleString()} {selectedBondForList.depositToken}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Interest Rate:</span>
                <span className="font-semibold text-[var(--success)]">{(selectedBondForList.yieldBps / 100).toFixed(2)}% APY</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Maturity Date:</span>
                <span className="font-semibold text-[var(--foreground)]">{new Date(selectedBondForList.maturityDate * 1000).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Price input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Asking Price (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="e.g. 980"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  className="w-full h-11 pl-3 pr-16 rounded-xl border font-medium text-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--card)]"
                  style={{ borderColor: 'var(--border)' }}
                />
                <span className="absolute right-3 top-3 text-xs font-semibold text-[var(--muted-foreground)]">
                  USDC
                </span>
              </div>
            </div>

            {/* Calculations preview */}
            {listPrice && parseFloat(listPrice) > 0 && (() => {
              const priceVal = parseFloat(listPrice);
              const discount = ((selectedBondForList.principal - priceVal) / selectedBondForList.principal) * 100;
              const { ytm } = calculateYTM(selectedBondForList, priceVal);
              const fee = priceVal * 0.002;
              const netProceeds = priceVal - fee;

              return (
                <div className="rounded-xl p-3 bg-[var(--info-soft)] space-y-2 border border-[var(--info-border)] animate-fade-in">
                  <div className="flex justify-between text-xs text-[var(--info-foreground)]">
                    <span>Discount:</span>
                    <span className="font-bold">{discount > 0 ? `${discount.toFixed(2)}%` : "None (Premium)"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[var(--info-foreground)]">
                    <span className="flex items-center">
                      Buyer's YTM:
                      <Tooltip text="Yield-to-Maturity (YTM) is the total annualized rate of return expected on a bond if it is held until maturity. When selling at a discount, this rate rises." />
                    </span>
                    <span className="font-bold text-[var(--success)]">{ytm.toFixed(2)}% APY</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[var(--info-foreground)]">
                    <span className="flex items-center">
                      Trading Fee (0.20%):
                      <Tooltip text="Used to support paymaster infrastructure for smart account gasless transactions." />
                    </span>
                    <span className="font-semibold">{fee.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--info-foreground)] pt-1 border-t border-[var(--info-border)]">
                    <span>Expected Net Proceeds:</span>
                    <span className="font-bold text-[var(--foreground)]">{netProceeds.toFixed(2)} USDC</span>
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {!isApproved ? (
                <button
                  onClick={handleApproveAll}
                  disabled={isActionPending}
                  className="btn-primary w-full h-11 font-semibold"
                >
                  {isActionPending ? <Loader2 className="animate-spin" /> : "Approve OTC to Transfer Bond"}
                </button>
              ) : (
                <button
                  onClick={handleListOrder}
                  disabled={isActionPending}
                  className="btn-primary w-full h-11 font-semibold"
                >
                  {isActionPending ? <Loader2 className="animate-spin" /> : "Confirm & List Sale Order"}
                </button>
              )}
              <button
                onClick={() => setSelectedBondForList(null)}
                className="btn-secondary w-full h-11 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
