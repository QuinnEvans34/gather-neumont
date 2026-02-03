import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AuthMe, AuthMode } from "./authTypes";
import { authStorage } from "./authStorage";

type AuthContextValue = {
  mode: AuthMode;
  me?: AuthMe;
  continueAsGuest: () => void;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toModeFromMe(me: AuthMe | undefined): AuthMode {
  if (!me) return "unknown";
  return me.isAdmin ? "admin" : "user";
}

function parseMeFromApi(payload: unknown): AuthMe | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const anyPayload = payload as any;
  const user = anyPayload.user ?? anyPayload.me ?? anyPayload;
  if (!user || typeof user !== "object") return undefined;

  const username = (user as any).username;
  if (typeof username !== "string" || !username.trim()) return undefined;

  const isAdmin = Boolean((user as any).isAdmin ?? (user as any).admin);
  return { username, isAdmin };
}

export function AuthProvider(props: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AuthMode>(() =>
    authStorage.isGuestChosen() ? "guest" : "unknown",
  );
  const [me, setMe] = useState<AuthMe | undefined>(undefined);

  const refreshInFlight = useRef<Promise<void> | null>(null);
  const didInit = useRef(false);

  const continueAsGuest = useCallback(() => {
    authStorage.setGuestChosen(true);
    setMe(undefined);
    setMode("guest");
  }, []);

  const login = useCallback(async (username: string) => {
    authStorage.setGuestChosen(false);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (!res.ok) {
      let message = `Login failed (${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) message = String(data.error);
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    const data = await res.json();
    const nextMe = parseMeFromApi(data);
    if (!nextMe) {
      throw new Error("Login succeeded but user payload was missing/invalid");
    }

    setMe(nextMe);
    setMode(toModeFromMe(nextMe));
  }, []);

  const logout = useCallback(async () => {
    authStorage.setGuestChosen(false);
    setMe(undefined);
    setMode("unknown");

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // If the endpoint doesn't exist or the network fails, client state is already cleared.
    }
  }, []);

  const refresh = useCallback(async () => {
    if (authStorage.isGuestChosen()) {
      setMe(undefined);
      setMode("guest");
      return;
    }

    if (refreshInFlight.current) return refreshInFlight.current;

    refreshInFlight.current = (async () => {
      try {
        const res = await fetch("/api/auth/me", { method: "GET" });
        if (!res.ok) {
          // If the endpoint doesn't exist, keep "unknown" until login/guest.
          if (res.status === 404) return;
          return;
        }

        const data = await res.json();
        const nextMe = parseMeFromApi(data);
        if (!nextMe) {
          setMe(undefined);
          setMode("unknown");
          return;
        }

        setMe(nextMe);
        setMode(toModeFromMe(nextMe));
      } catch {
        // keep current state
      } finally {
        refreshInFlight.current = null;
      }
    })();

    return refreshInFlight.current;
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({ mode, me, continueAsGuest, login, logout, refresh }),
    [continueAsGuest, login, logout, me, mode, refresh],
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

