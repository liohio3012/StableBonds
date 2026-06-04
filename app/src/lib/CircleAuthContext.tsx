"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  AuthSession,
  registerPasskey,
  loginPasskey,
  loginEmailOTP,
  restoreSession,
  logoutSession
} from './circle-auth';

interface CircleAuthContextType {
  account: any | null;
  session: AuthSession | null;
  loading: boolean;
  registerWithPasskey: (username: string) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  sendEmailOTP: (email: string) => Promise<boolean>;
  verifyEmailOTP: (email: string, code: string) => Promise<void>;
  logout: () => void;
  isSmartAccount: boolean;
}

const CircleAuthContext = createContext<CircleAuthContextType | undefined>(undefined);

export const useCircleAuth = () => {
  const context = useContext(CircleAuthContext);
  if (!context) throw new Error('useCircleAuth must be used within a CircleAuthProvider');
  return context;
};

export const CircleAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<any | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const restored = await restoreSession();
        if (restored) {
          setAccount(restored.account);
          setSession(restored.session);
        }
      } catch (err) {
        console.error("Failed to restore Circle session:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const registerWithPasskey = async (username: string) => {
    setLoading(true);
    try {
      const res = await registerPasskey(username);
      setAccount(res.account);
      setSession(res.session);
      toast.success(`Passkey registered successfully! Welcome, ${username}.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to register passkey');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithPasskey = async () => {
    setLoading(true);
    try {
      const res = await loginPasskey();
      setAccount(res.account);
      setSession(res.session);
      toast.success(`Welcome back, ${res.session.username}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to login with passkey');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOTP = async (email: string) => {
    try {
      const res = await loginEmailOTP(email);
      toast.success(`Verification code sent to ${email} (Use 123456 for testing)`);
      return !!res.codeSent;
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP code');
      throw err;
    }
  };

  const verifyEmailOTP = async (email: string, code: string) => {
    setLoading(true);
    try {
      const res = await loginEmailOTP(email, code);
      if (res.account && res.session) {
        setAccount(res.account);
        setSession(res.session);
        toast.success(`Authenticated successfully! Welcome, ${res.session.username}.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logoutSession();
    setAccount(null);
    setSession(null);
    toast.info('Logged out from smart account.');
  };

  return (
    <CircleAuthContext.Provider
      value={{
        account,
        session,
        loading,
        registerWithPasskey,
        loginWithPasskey,
        sendEmailOTP,
        verifyEmailOTP,
        logout,
        isSmartAccount: !!account,
      }}
    >
      {children}
    </CircleAuthContext.Provider>
  );
};
