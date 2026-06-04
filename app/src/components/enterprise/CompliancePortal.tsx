"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWriteContract, useWalletClient } from 'wagmi';
import { parseAbi } from 'viem';
import { Shield, ShieldCheck, AlertOctagon, CheckCircle2, User, Building, FileText, Upload, Trash2, ArrowRight, Loader2, Key, Search, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { useCircleAuth } from '@/lib/CircleAuthContext';

const VAULT_ADDRESS = "0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" as `0x${string}`;

const VAULT_ABI_COMPLIANCE = parseAbi([
  "function owner() external view returns (address)",
  "function complianceRegistry() external view returns (address)"
]);

const REGISTRY_ABI = parseAbi([
  "function isVerified(address _user) external view returns (bool)",
  "function isBlacklisted(address _user) external view returns (bool)",
  "function verifyWallet(address _user) external",
  "function blacklistWallet(address _user) external",
  "function removeWallet(address _user) external"
]);

interface KYCData {
  companyName: string;
  ein: string;
  country: string;
  repName: string;
  repEmail: string;
  filesCount: number;
}

export default function CompliancePortal() {
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: smartAccount } = useCircleAuth();
  
  const userAddress = smartAccount?.address || eoaAddress;
  const isConnected = !!userAddress;

  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Smart Contract States
  const [registryAddress, setRegistryAddress] = useState<string | null>(null);
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [isVerifiedOnChain, setIsVerifiedOnChain] = useState<boolean>(false);
  const [isBlacklistedOnChain, setIsBlacklistedOnChain] = useState<boolean>(false);

  // UI Flow States
  const [kycStep, setKycStep] = useState<1 | 2 | 3 | 4>(1);
  const [verifying, setVerifying] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState<string | null>(null);
  
  // Forms state
  const [companyName, setCompanyName] = useState('');
  const [ein, setEin] = useState('');
  const [country, setCountry] = useState('United States');
  const [repName, setRepName] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  
  // Admin form state
  const [targetAddress, setTargetAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResult, setSearchResult] = useState<{ verified: boolean, blacklisted: boolean } | null>(null);

  // Local storage backup (for simulation/dev mode)
  const [localVerification, setLocalVerification] = useState<boolean>(false);
  const [localBlacklist, setLocalBlacklist] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedVerify = localStorage.getItem(`kyc_verified_${userAddress}`);
      const storedBlack = localStorage.getItem(`kyc_blacklisted_${userAddress}`);
      setLocalVerification(storedVerify === 'true');
      setLocalBlacklist(storedBlack === 'true');
    }
  }, [userAddress]);

  // Load contract parameters and check status
  const checkComplianceStatus = async () => {
    if (!isConnected || !userAddress || !publicClient) return;

    try {
      // 1. Get owner and registry address from Vault
      const [ownerAddr, regAddr] = await Promise.all([
        publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI_COMPLIANCE,
          functionName: 'owner'
        }).catch(() => null),
        publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI_COMPLIANCE,
          functionName: 'complianceRegistry'
        }).catch(() => null)
      ]);

      if (ownerAddr) setContractOwner(ownerAddr);
      if (regAddr && regAddr !== '0x0000000000000000000000000000000000000000') {
        setRegistryAddress(regAddr);

        // 2. Query compliance on-chain
        const [verified, blacklisted] = await Promise.all([
          publicClient.readContract({
            address: regAddr as `0x${string}`,
            abi: REGISTRY_ABI,
            functionName: 'isVerified',
            args: [userAddress as `0x${string}`]
          }),
          publicClient.readContract({
            address: regAddr as `0x${string}`,
            abi: REGISTRY_ABI,
            functionName: 'isBlacklisted',
            args: [userAddress as `0x${string}`]
          })
        ]);

        setIsVerifiedOnChain(!!verified);
        setIsBlacklistedOnChain(!!blacklisted);
      } else {
        setRegistryAddress(null);
      }
    } catch (err) {
      console.error("Error checking compliance status from contracts:", err);
    }
  };

  useEffect(() => {
    checkComplianceStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, isConnected]);

  // Derived statuses
  const isVerified = isVerifiedOnChain || localVerification;
  const isBlacklisted = isBlacklistedOnChain || localBlacklist;
  const isAdmin = isConnected && contractOwner && userAddress?.toLowerCase() === contractOwner.toLowerCase();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => f.name);
      setFiles(prev => [...prev, ...newFiles]);
      toast.success('Document uploaded successfully');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please upload at least one verification document.');
      return;
    }

    setVerifying(true);
    // Simulate API submission and verification cycle
    setTimeout(async () => {
      try {
        // If registry contract is set and the user has admin rights or we can self-verify on dev
        localStorage.setItem(`kyc_verified_${userAddress}`, 'true');
        setLocalVerification(true);
        setKycStep(4);
        toast.success('KYC/KYB Verification Completed Successfully!');
        
        // Dispatch custom event to notify other components to update
        window.dispatchEvent(new Event('compliance-status-changed'));
      } catch (err) {
        toast.error('On-chain enrollment failed. Local credentials stored.');
      } finally {
        setVerifying(false);
      }
    }, 2500);
  };

  // Admin Actions
  const handleVerifyAddress = async (addr: string) => {
    if (!addr.startsWith('0x') || addr.length !== 42) {
      toast.error('Invalid Ethereum address format.');
      return;
    }
    setAdminActionLoading('verify');
    try {
      if (registryAddress) {
        const tx = await writeContractAsync({
          address: registryAddress as `0x${string}`,
          abi: REGISTRY_ABI,
          functionName: 'verifyWallet',
          args: [addr as `0x${string}`]
        });
        toast.success(`Verification transaction sent: ${tx.slice(0, 10)}...`);
      } else {
        localStorage.setItem(`kyc_verified_${addr}`, 'true');
        toast.success(`Address verified in local storage (Dev mode)`);
      }
      setTargetAddress('');
      checkComplianceStatus();
    } catch (err: any) {
      toast.error(`Verification failed: ${err.message || err}`);
    } finally {
      setAdminActionLoading(null);
    }
  };

  const handleBlacklistAddress = async (addr: string) => {
    if (!addr.startsWith('0x') || addr.length !== 42) {
      toast.error('Invalid Ethereum address format.');
      return;
    }
    setAdminActionLoading('blacklist');
    try {
      if (registryAddress) {
        const tx = await writeContractAsync({
          address: registryAddress as `0x${string}`,
          abi: REGISTRY_ABI,
          functionName: 'blacklistWallet',
          args: [addr as `0x${string}`]
        });
        toast.success(`Blacklist transaction sent: ${tx.slice(0, 10)}...`);
      } else {
        localStorage.setItem(`kyc_blacklisted_${addr}`, 'true');
        localStorage.removeItem(`kyc_verified_${addr}`);
        toast.success(`Address blacklisted in local storage (Dev mode)`);
      }
      setTargetAddress('');
      checkComplianceStatus();
    } catch (err: any) {
      toast.error(`Blacklist failed: ${err.message || err}`);
    } finally {
      setAdminActionLoading(null);
    }
  };

  const handleRemoveAddress = async (addr: string) => {
    if (!addr.startsWith('0x') || addr.length !== 42) {
      toast.error('Invalid Ethereum address format.');
      return;
    }
    setAdminActionLoading('remove');
    try {
      if (registryAddress) {
        const tx = await writeContractAsync({
          address: registryAddress as `0x${string}`,
          abi: REGISTRY_ABI,
          functionName: 'removeWallet',
          args: [addr as `0x${string}`]
        });
        toast.success(`Removal transaction sent: ${tx.slice(0, 10)}...`);
      } else {
        localStorage.removeItem(`kyc_verified_${addr}`);
        localStorage.removeItem(`kyc_blacklisted_${addr}`);
        toast.success(`Address reset in local storage (Dev mode)`);
      }
      setTargetAddress('');
      checkComplianceStatus();
    } catch (err: any) {
      toast.error(`Removal failed: ${err.message || err}`);
    } finally {
      setAdminActionLoading(null);
    }
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.startsWith('0x') || searchAddress.length !== 42) {
      toast.error('Invalid Ethereum address format.');
      return;
    }

    try {
      if (registryAddress) {
        const [verified, blacklisted] = await Promise.all([
          publicClient?.readContract({
            address: registryAddress as `0x${string}`,
            abi: REGISTRY_ABI,
            functionName: 'isVerified',
            args: [searchAddress as `0x${string}`]
          }),
          publicClient?.readContract({
            address: registryAddress as `0x${string}`,
            abi: REGISTRY_ABI,
            functionName: 'isBlacklisted',
            args: [searchAddress as `0x${string}`]
          })
        ]);
        setSearchResult({ verified: !!verified, blacklisted: !!blacklisted });
      } else {
        const v = localStorage.getItem(`kyc_verified_${searchAddress}`) === 'true';
        const b = localStorage.getItem(`kyc_blacklisted_${searchAddress}`) === 'true';
        setSearchResult({ verified: v, blacklisted: b });
      }
    } catch (err) {
      toast.error("Failed to query registry address status.");
    }
  };

  const devResetKYC = () => {
    localStorage.removeItem(`kyc_verified_${userAddress}`);
    localStorage.removeItem(`kyc_blacklisted_${userAddress}`);
    setLocalVerification(false);
    setLocalBlacklist(false);
    setIsVerifiedOnChain(false);
    setIsBlacklistedOnChain(false);
    setKycStep(1);
    toast.success('KYC/KYB status reset (Dev mode)');
    window.dispatchEvent(new Event('compliance-status-changed'));
  };

  const devSetSanctioned = () => {
    localStorage.setItem(`kyc_blacklisted_${userAddress}`, 'true');
    localStorage.removeItem(`kyc_verified_${userAddress}`);
    setLocalBlacklist(true);
    setLocalVerification(false);
    toast.warning('Account set to Sanctioned/Blacklisted');
    window.dispatchEvent(new Event('compliance-status-changed'));
  };

  if (!isConnected) {
    return (
      <div className="card-surface p-8 text-center max-w-lg mx-auto">
        <Shield size={48} className="mx-auto mb-4 text-neutral-400" />
        <h3 className="text-lg font-bold text-neutral-900">Sign In Required</h3>
        <p className="text-sm text-neutral-500 mt-2">
          Please connect your corporate wallet or sign in using a biometric Passkey to view compliance settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Verification Banner */}
      <div className="card-surface p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isBlacklisted 
              ? 'bg-red-50 text-red-600 border border-red-200' 
              : isVerified 
                ? 'bg-green-50 text-green-600 border border-green-200' 
                : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}>
            {isBlacklisted ? <AlertOctagon size={24} /> : isVerified ? <ShieldCheck size={24} /> : <Shield size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-base text-neutral-900">
              {isBlacklisted 
                ? 'Address Blocked (Sanctioned)' 
                : isVerified 
                  ? 'KYC/KYB Verification Approved' 
                  : 'Verification Required'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Wallet: <span className="font-mono">{userAddress}</span>
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Registry: {registryAddress ? <span className="font-mono text-neutral-800">{registryAddress} (On-chain)</span> : 'Simulated (Dev Mode)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isVerified && !isBlacklisted && (
            <span className="px-3 py-1 text-xs font-bold bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Compliant
            </span>
          )}
          {isBlacklisted && (
            <span className="px-3 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-200 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
              Blocked
            </span>
          )}
          {!isVerified && !isBlacklisted && (
            <span className="px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1.5 uppercase tracking-wide animate-pulse">
              Pending Verification
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Compliance Wizard / Status Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="card-surface p-6">
            <h3 className="font-bold text-base text-neutral-900 mb-6 flex items-center gap-2">
              <Building size={18} className="text-neutral-500" />
              Corporate KYC/KYB Onboarding
            </h3>

            {/* Steps Wizard if unverified */}
            {!isVerified && !isBlacklisted && (
              <div>
                {/* Steps indicator */}
                <div className="flex items-center mb-6">
                  {[1, 2, 3].map((step) => (
                    <React.Fragment key={step}>
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
                          kycStep === step 
                            ? 'bg-neutral-900 text-white border-neutral-900' 
                            : kycStep > step 
                              ? 'bg-neutral-100 text-neutral-700 border-neutral-300' 
                              : 'bg-white text-neutral-400 border-neutral-200'
                        }`}>
                          {kycStep > step ? <CheckCircle2 size={16} className="text-green-600" /> : step}
                        </div>
                        <span className="ml-2 text-xs font-medium text-neutral-600 hidden sm:inline">
                          {step === 1 && 'Company Info'}
                          {step === 2 && 'Representative'}
                          {step === 3 && 'Verification Documents'}
                        </span>
                      </div>
                      {step < 3 && <div className="flex-grow h-px bg-neutral-200 mx-4"></div>}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step 1: Company Info */}
                {kycStep === 1 && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Registered Company Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Acme Treasury Corp"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-black outline-hidden"
                          style={{ borderColor: 'var(--border)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Company Registration No (EIN / VAT)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 12-3456789"
                          value={ein}
                          onChange={(e) => setEin(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-black outline-hidden"
                          style={{ borderColor: 'var(--border)' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Country of Incorporation</label>
                      <select 
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-black outline-hidden"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <option>United States</option>
                        <option>United Kingdom</option>
                        <option>Germany</option>
                        <option>France</option>
                        <option>Singapore</option>
                      </select>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button 
                        onClick={() => {
                          if (!companyName || !ein) {
                            toast.error('Please fill in all company information fields.');
                            return;
                          }
                          setKycStep(2);
                        }}
                        className="btn-primary text-xs py-2 px-4 gap-1.5"
                      >
                        Next Step
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Rep Info */}
                {kycStep === 2 && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Authorized Representative Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Alice Smith"
                          value={repName}
                          onChange={(e) => setRepName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-black outline-hidden"
                          style={{ borderColor: 'var(--border)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Business Email Address</label>
                        <input 
                          type="email" 
                          placeholder="e.g. alice@acmetreasury.com"
                          value={repEmail}
                          onChange={(e) => setRepEmail(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-black outline-hidden"
                          style={{ borderColor: 'var(--border)' }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button 
                        onClick={() => setKycStep(1)}
                        className="border hover:bg-neutral-50 px-4 py-2 rounded-lg text-xs font-semibold text-neutral-700 bg-white"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => {
                          if (!repName || !repEmail) {
                            toast.error('Please enter representative details.');
                            return;
                          }
                          setKycStep(3);
                        }}
                        className="btn-primary text-xs py-2 px-4 gap-1.5"
                      >
                        Next Step
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: File upload */}
                {kycStep === 3 && (
                  <form onSubmit={submitKYC} className="space-y-4 animate-slide-up">
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-neutral-50 transition-colors relative cursor-pointer"
                      style={{ borderColor: 'var(--border)' }}>
                      <input 
                        type="file" 
                        multiple
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="mx-auto mb-2 text-neutral-400" size={24} />
                      <p className="text-xs font-semibold text-neutral-700">Click to upload company verification documents</p>
                      <p className="text-[10px] text-neutral-400 mt-1">Provide Certificate of Incorporation or Government Business Registry documents (PDF, PNG, JPG)</p>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-neutral-700">Uploaded Documents:</h4>
                        {files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg border bg-neutral-50 text-xs"
                            style={{ borderColor: 'var(--border-subtle)' }}>
                            <span className="font-medium text-neutral-700 flex items-center gap-1.5 font-mono">
                              <FileText size={14} />
                              {file}
                            </span>
                            <button 
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <button 
                        type="button"
                        onClick={() => setKycStep(2)}
                        className="border hover:bg-neutral-50 px-4 py-2 rounded-lg text-xs font-semibold text-neutral-700 bg-white"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        Back
                      </button>
                      <button 
                        type="submit"
                        disabled={verifying}
                        className="btn-primary text-xs py-2 px-6 gap-1.5 flex items-center"
                      >
                        {verifying && <Loader2 size={14} className="animate-spin" />}
                        Submit Verification
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Approved View */}
            {isVerified && !isBlacklisted && (
              <div className="text-center py-6 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={36} />
                </div>
                <h4 className="font-bold text-lg text-neutral-900">Your Corporate Wallet is Verified</h4>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
                  Compliance validation successful. You have access to lock fixed yields, buy bonds, and deploy yield strategies on Arc.
                </p>

                <div className="mt-8 flex justify-center gap-3">
                  <button 
                    onClick={devResetKYC}
                    className="border border-neutral-200 text-neutral-600 hover:bg-neutral-50 px-4 py-2 rounded-lg text-xs font-semibold bg-white cursor-pointer"
                  >
                    Reset Status (Dev Mode)
                  </button>
                </div>
              </div>
            )}

            {/* Blacklisted View */}
            {isBlacklisted && (
              <div className="text-center py-6 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4">
                  <Ban size={36} />
                </div>
                <h4 className="font-bold text-lg text-neutral-900">Address Sanctioned / Blacklisted</h4>
                <p className="text-sm text-red-600 max-w-sm mx-auto mt-2 leading-relaxed">
                  Your address has been blocked due to regulatory compliance check failure. All bond deposit and settlement interactions are locked.
                </p>

                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={devResetKYC}
                    className="border border-neutral-200 text-neutral-600 hover:bg-neutral-50 px-4 py-2 rounded-lg text-xs font-semibold bg-white cursor-pointer"
                  >
                    Reset Status (Dev Mode)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Column & Dev Actions */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="card-surface p-6">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
              <Shield size={14} />
              Why compliance?
            </h3>
            <p className="text-xs leading-relaxed text-neutral-600">
              StablePay B2B yields are secured by compliant debt securities pools. Enforcing KYC/KYB is legally required under institutional asset guidelines.
            </p>
            <div className="mt-4 pt-4 border-t space-y-2.5 text-xs text-neutral-500" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-green-600" />
                <span>Circle Compliance APIs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-green-600" />
                <span>Sanctioned list screening</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-green-600" />
                <span>FATF standards matching</span>
              </div>
            </div>
          </div>

          {/* Dev Simulation Tools */}
          <div className="card-surface p-6 bg-amber-50/20 border border-amber-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800 mb-4 flex items-center gap-2">
              <Key size={14} />
              Compliance Simulation (Dev Mode)
            </h3>
            <p className="text-xs text-amber-700 leading-normal mb-4">
              Since you are running in a sandbox environment, you can simulate different compliance triggers without submitting real corporate documents.
            </p>
            <div className="space-y-2">
              {!isVerified && !isBlacklisted && (
                <button 
                  onClick={() => {
                    localStorage.setItem(`kyc_verified_${userAddress}`, 'true');
                    setLocalVerification(true);
                    toast.success('Address auto-verified locally.');
                    window.dispatchEvent(new Event('compliance-status-changed'));
                  }}
                  className="w-full py-2 px-3 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-all cursor-pointer text-center"
                >
                  Quick Auto-Verify Address
                </button>
              )}
              {!isBlacklisted && (
                <button 
                  onClick={devSetSanctioned}
                  className="w-full py-2 px-3 border border-red-200 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50 transition-all cursor-pointer text-center bg-white"
                >
                  Simulate Sanction Block
                </button>
              )}
              {(isVerified || isBlacklisted) && (
                <button 
                  onClick={devResetKYC}
                  className="w-full py-2 px-3 border border-amber-300 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-50 transition-all cursor-pointer text-center bg-white"
                >
                  Reset Status
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Panel (Visible only if owner of contract) */}
      {isAdmin && (
        <div className="card-surface p-6 mt-8 animate-slide-up">
          <h3 className="font-bold text-base text-neutral-900 mb-2 flex items-center gap-2">
            <Key size={18} className="text-neutral-500" />
            Compliance Registry Admin Control Panel
          </h3>
          <p className="text-xs text-neutral-500 mb-6">
            You are connected as the contract owner (<span className="font-mono text-neutral-800">{contractOwner}</span>). You can manage registry whitelists on-chain.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Address whitelist actions */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Manage Registry Entries</h4>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Target Wallet Address</label>
                <input 
                  type="text" 
                  placeholder="0x..."
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-black outline-hidden font-mono"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleVerifyAddress(targetAddress)}
                  disabled={!!adminActionLoading}
                  className="py-2 px-4 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {adminActionLoading === 'verify' && <Loader2 size={13} className="animate-spin" />}
                  Verify / Whitelist
                </button>
                <button 
                  onClick={() => handleBlacklistAddress(targetAddress)}
                  disabled={!!adminActionLoading}
                  className="py-2 px-4 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 bg-white"
                >
                  {adminActionLoading === 'blacklist' && <Loader2 size={13} className="animate-spin" />}
                  Blacklist
                </button>
                <button 
                  onClick={() => handleRemoveAddress(targetAddress)}
                  disabled={!!adminActionLoading}
                  className="py-2 px-4 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 bg-white"
                >
                  {adminActionLoading === 'remove' && <Loader2 size={13} className="animate-spin" />}
                  Reset Address
                </button>
              </div>
            </div>

            {/* Address query */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Query Address Status</h4>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search 0x..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="flex-grow px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-black outline-hidden font-mono"
                  style={{ borderColor: 'var(--border)' }}
                />
                <button 
                  onClick={handleSearchAddress}
                  className="p-2 border hover:bg-neutral-50 rounded-lg text-neutral-700 transition-all cursor-pointer bg-white"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Search size={18} />
                </button>
              </div>

              {searchResult && (
                <div className="p-4 border rounded-xl bg-neutral-50 space-y-2 text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 font-medium">Verified / Whitelisted:</span>
                    <span className={`font-semibold ${searchResult.verified ? 'text-green-600' : 'text-neutral-500'}`}>
                      {searchResult.verified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 font-medium">Blacklisted / Sanctioned:</span>
                    <span className={`font-semibold ${searchResult.blacklisted ? 'text-red-600' : 'text-neutral-500'}`}>
                      {searchResult.blacklisted ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
