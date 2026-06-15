"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, usePublicClient, useWatchContractEvent, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi, formatUnits, encodeFunctionData } from 'viem';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, CheckCircle2, Clock, ArrowUpRight, AlertCircle, X, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import { bundlerClient } from '@/lib/circle-auth';

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
  "function bonds(uint256) view returns (address owner, uint256 principal, uint256 yieldBps, uint256 maturityDate, bool isSettled, uint256 termId, address depositToken, address settlementToken, bool swapAtDeposit, (address supplier, uint32 destDomain, bool isConfigured) intent)",
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
};

const TRANSFER_METHOD_MAP: Record<number, string> = {
  0: "Standard Transfer",
  2: "Priority Transfer",
  3: "Express Transfer",
  6: "Economy Transfer",
  22: "International Transfer"
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MaturityCalendar() {
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, isSmartAccount } = useCircleAuth();
  const isConnected = isEoaConnected || isSmartAccount;
  const address = isSmartAccount ? circleAccount?.address : eoaAddress;

  const publicClient = usePublicClient();
  const [bondsList, setBondsList] = useState<Bond[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null);
  const [smartWithdrawPending, setSmartWithdrawPending] = useState(false);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const { data: nextBondIdData, refetch } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'nextBondId',
  });

  // Early Withdrawal Hooks
  const { data: withdrawHash, writeContract: writeWithdraw, isPending: isWithdrawing } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  const displayIsWithdrawing = isSmartAccount ? smartWithdrawPending : (isWithdrawing || isWithdrawConfirming);

  useEffect(() => {
    if (isWithdrawSuccess) {
      toast.success("Early withdrawal completed ✓", {
        description: "Your funds (minus the 2.0% penalty) have been returned to your account.",
        action: withdrawHash ? {
          label: 'View receipt',
          onClick: () => window.open(`https://testnet.arcscan.app/tx/${withdrawHash}`, '_blank')
        } : undefined
      });
      setSelectedBond(null);
      refetch();
    }
  }, [isWithdrawSuccess, withdrawHash, refetch]);

  const handleEarlyWithdraw = async (bond: Bond) => {
    const refund = (parseFloat(bond.principal) * 0.98).toFixed(2);
    const lockedAsset = bond.swapAtDeposit ? bond.settlementToken : bond.depositToken;
    if (!window.confirm(`Are you sure you want to withdraw Bond #${bond.id} early? You will receive your refund of ${refund} ${lockedAsset} (minus a 2.0% early withdrawal penalty).`)) {
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
            args: [BigInt(bond.id)],
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
        
        toast.success("Early withdrawal completed ✓", {
          description: "Your funds (minus the 2.0% penalty) have been returned to your account.",
          action: {
            label: 'View receipt',
            onClick: () => window.open(`https://testnet.arcscan.app/tx/${receipt.transactionHash}`, '_blank')
          }
        });
        
        setSelectedBond(null);
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
          args: [BigInt(bond.id)],
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

  const fetchBonds = async () => {
    if (!publicClient || !nextBondIdData || !address) return;
    setIsLoading(true);
    
    try {
      const nextId = Number(nextBondIdData);
      if (nextId === 0) {
        setBondsList([]);
        return;
      }

      // Fetch the last 50 bonds to display in the calendar view
      const startId = Math.max(1, nextId - 50);
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
              destDomain: bondData[9].destDomain
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
  };

  useEffect(() => {
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

  // Calculate calendar days
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 6 is Saturday
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

    // Prev Month filler days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = totalDaysInPrevMonth - i;
      const prevMonthDate = new Date(currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth === 0 ? 11 : currentMonth - 1, day);
      cells.push({
        date: prevMonthDate,
        isCurrentMonth: false,
        key: `prev-${day}`
      });
    }

    // Current Month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      cells.push({
        date: new Date(currentYear, currentMonth, day),
        isCurrentMonth: true,
        key: `current-${day}`
      });
    }

    // Next Month filler days
    const totalCells = cells.length;
    const remainingCells = 42 - totalCells; // Standard 6-week calendar grid
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDate = new Date(currentMonth === 11 ? currentYear + 1 : currentYear, currentMonth === 11 ? 0 : currentMonth + 1, day);
      cells.push({
        date: nextMonthDate,
        isCurrentMonth: false,
        key: `next-${day}`
      });
    }

    return cells;
  }, [currentMonth, currentYear]);

  // Group bonds by date key (YYYY-MM-DD)
  const bondsByDate = useMemo(() => {
    const map: Record<string, Bond[]> = {};
    bondsList.forEach(bond => {
      const date = new Date(bond.maturityDate * 1000);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(bond);
    });
    return map;
  }, [bondsList]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getBondStatus = (bond: Bond) => {
    const isMatured = Date.now() >= bond.maturityDate * 1000;
    if (bond.isSettled) return 'delivered';
    if (isMatured) return 'delivering';
    return 'earning';
  };

  if (!isConnected) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mb-12 animate-fade-in">
      {/* Calendar Header Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Maturity Calendar
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Track and manage your upcoming supplier payments visually on a calendar grid.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button onClick={handleToday} className="btn-secondary text-xs px-3 py-1.5 font-semibold">
            Today
          </button>
          <div className="flex items-center border rounded-lg" style={{ borderColor: 'var(--border)' }}>
            <button onClick={handlePrevMonth} className="p-2 hover:bg-[var(--muted)]/50 transition-colors text-[var(--muted-foreground)]">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold px-3 min-w-[120px] text-center" style={{ color: 'var(--foreground)' }}>
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-[var(--muted)]/50 transition-colors text-[var(--muted-foreground)]">
              <ChevronRight size={16} />
            </button>
          </div>
          <button 
            onClick={() => refetch()} 
            className="btn-secondary p-2 ml-1 text-[var(--muted-foreground)]"
            title="Refresh"
            id="btn-calendar-refresh"
          >
            <Loader2 size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="card-surface overflow-hidden shadow-sm" style={{ border: '1px solid var(--border)' }}>
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center py-2.5 font-semibold text-xs tracking-wider border-b" 
          style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          {DAYS_OF_WEEK.map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y" style={{ borderColor: 'var(--border)' }}>
          {calendarCells.map((cell, idx) => {
            const date = cell.date;
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const dayBonds = bondsByDate[dateKey] || [];
            
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div 
                key={cell.key} 
                className={`min-h-[100px] p-2 flex flex-col justify-between transition-colors relative ${
                  cell.isCurrentMonth ? 'bg-[var(--canvas)]' : 'bg-[var(--muted)]/30 opacity-60'
                } ${isToday ? 'ring-1 ring-inset ring-[var(--primary)]' : ''}`}
                style={{ 
                  borderLeft: idx % 7 === 0 ? 'none' : '1px solid var(--border)',
                  borderTop: idx < 7 ? 'none' : '1px solid var(--border)',
                }}
              >
                {/* Date Number */}
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-semibold rounded-md w-5 h-5 flex items-center justify-center ${
                    isToday 
                      ? 'bg-[var(--primary)] text-white font-bold' 
                      : cell.isCurrentMonth ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
                  }`}>
                    {date.getDate()}
                  </span>
                  
                  {/* Indicator for multiple events */}
                  {dayBonds.length > 0 && (
                    <span className="text-[10px] font-bold opacity-75" style={{ color: 'var(--muted-foreground)' }}>
                      {dayBonds.length} pay{dayBonds.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Day Content (Active Bonds list) */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[70px] scrollbar-thin">
                  {dayBonds.slice(0, 3).map(bond => {
                    const status = getBondStatus(bond);
                    const lockedAsset = bond.swapAtDeposit ? bond.settlementToken : bond.depositToken;
                    
                    let statusColor = 'var(--primary-soft)';
                    let textColor = 'var(--primary)';
                    
                    if (status === 'delivered') {
                      statusColor = 'var(--success-soft)';
                      textColor = 'var(--success-foreground)';
                    } else if (status === 'delivering') {
                      statusColor = 'var(--warning-soft)';
                      textColor = 'var(--warning-foreground)';
                    }

                    return (
                      <button
                        key={bond.id}
                        onClick={() => setSelectedBond(bond)}
                        className="text-[10px] font-semibold text-left px-1.5 py-0.5 rounded transition-all truncate hover:brightness-95 w-full flex items-center gap-1"
                        style={{ background: statusColor, color: textColor }}
                      >
                        <span className="w-1.5 h-1.5 rounded-md shrink-0" 
                          style={{ 
                            background: status === 'delivered' 
                              ? 'var(--success)' 
                              : status === 'delivering' 
                                ? 'var(--warning)' 
                                : 'var(--primary)' 
                          }}></span>
                        #{bond.id} {parseFloat(bond.principal).toLocaleString(undefined, { maximumFractionDigits: 0 })} {lockedAsset}
                      </button>
                    );
                  })}
                  {dayBonds.length > 3 && (
                    <div className="text-[9px] text-center font-bold" style={{ color: 'var(--muted-foreground)' }}>
                      + {dayBonds.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Popover Modal */}
      {selectedBond && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="card-surface max-w-md w-full overflow-hidden shadow-2xl relative animate-scale-in"
            style={{ border: '1px solid var(--border)', background: 'var(--canvas)' }}>
            
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                  #{selectedBond.id}
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
                    Payment Details
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Maturity schedule info
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBond(null)} 
                className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Status Header Banner */}
              <div className="rounded-xl p-3.5 flex items-start gap-3" 
                style={{ 
                  background: selectedBond.isSettled 
                    ? 'var(--success-soft)' 
                    : (Date.now() >= selectedBond.maturityDate * 1000 ? 'var(--warning-soft)' : 'var(--info-soft)'),
                  border: `1px solid ${
                    selectedBond.isSettled 
                      ? 'var(--success-border)' 
                      : (Date.now() >= selectedBond.maturityDate * 1000 ? 'var(--warning-border)' : 'var(--info-border)')
                  }`
                }}>
                <div className="mt-0.5 shrink-0" 
                  style={{ 
                    color: selectedBond.isSettled 
                      ? 'var(--success)' 
                      : (Date.now() >= selectedBond.maturityDate * 1000 ? 'var(--warning)' : 'var(--info)')
                  }}>
                  {selectedBond.isSettled ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                </div>
                <div className="text-xs leading-normal">
                  {selectedBond.isSettled ? (
                    <span style={{ color: 'var(--success-foreground)' }}>
                      <strong>Delivered:</strong> The vendor has successfully received the funds on the destination chain.
                    </span>
                  ) : Date.now() >= selectedBond.maturityDate * 1000 ? (
                    <span style={{ color: 'var(--warning-foreground)' }}>
                      <strong>Delivering:</strong> Maturity reached. Automated CCTP transfer and yield distribution are running.
                    </span>
                  ) : (
                    <span style={{ color: 'var(--info-foreground)' }}>
                      <strong>Earning Yield:</strong> Actively locked in the vault. Accumulating interest at a fixed rate of {(selectedBond.yieldBps / 100).toFixed(2)}% APY.
                    </span>
                  )}
                </div>
              </div>

              {/* Parameters List */}
              <div className="space-y-2.5 rounded-xl p-3.5 border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--muted-foreground)' }}>Principal Locked</span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                    {parseFloat(selectedBond.principal).toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedBond.swapAtDeposit ? selectedBond.settlementToken : selectedBond.depositToken}
                  </span>
                </div>

                {selectedBond.depositToken !== selectedBond.settlementToken && (
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: 'var(--muted-foreground)' }}>Swap Configuration</span>
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {selectedBond.swapAtDeposit ? `Swap immediately at deposit` : `Swap at maturity`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--muted-foreground)' }}>Interest Rate</span>
                  <span className="font-semibold" style={{ color: 'var(--success)' }}>
                    {(selectedBond.yieldBps / 100).toFixed(2)}% APY
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--muted-foreground)' }}>Projected Yield</span>
                  <span className="font-semibold" style={{ color: 'var(--success)' }}>
                    +{(parseFloat(selectedBond.principal) * (selectedBond.yieldBps / 10000)).toFixed(2)} {selectedBond.swapAtDeposit ? selectedBond.settlementToken : selectedBond.depositToken}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Maturity Date</span>
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {new Date(selectedBond.maturityDate * 1000).toLocaleString(undefined, { 
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-start text-xs pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Transfer Target</span>
                  <div className="text-right">
                    <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {TRANSFER_METHOD_MAP[selectedBond.destDomain] || `Domain #${selectedBond.destDomain}`}
                    </div>
                    <span className="font-mono text-[10px] block opacity-75 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {selectedBond.supplier}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[var(--muted)] border-t flex justify-end gap-2.5" style={{ borderColor: 'var(--border)' }}>
              <button 
                onClick={() => setSelectedBond(null)} 
                className="btn-secondary text-xs px-4 py-2 font-semibold"
              >
                Close
              </button>
              
              {/* Show Early Exit button if not settled and not matured */}
              {!selectedBond.isSettled && Date.now() < selectedBond.maturityDate * 1000 && (
                <button
                  onClick={() => handleEarlyWithdraw(selectedBond)}
                  disabled={displayIsWithdrawing}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-[var(--error-border)] bg-[var(--error-soft)] text-[var(--error-foreground)] hover:bg-[var(--error)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  id={`btn-calendar-early-withdraw-${selectedBond.id}`}
                >
                  {displayIsWithdrawing ? "Exiting..." : "Early Exit (2.0% Penalty)"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
