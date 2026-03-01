import React, { createContext, useContext } from "react";
import { trpc } from "@/lib/trpc";

type AuthContextType = {
  user: any | null;
  loading: boolean;
  error: unknown | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: 1,
    staleTime: 60000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  console.log("[AuthProvider] Query state:", { isLoading: meQuery.isLoading, isError: meQuery.isError, error: meQuery.error?.message, data: meQuery.data });

  const logoutMutation = trpc.auth.logout.useMutation({
    async onSuccess() {
      try {
        utils.auth.me.setData(undefined, null);
        await utils.auth.me.invalidate();
      } catch {}
    },
  });

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {}
    try {
      localStorage.removeItem("username");
      localStorage.removeItem("auth-user-info");
    } catch {}
    try {
      await meQuery.refetch();
    } catch {}
  };

  const refresh = async () => {
    try {
      await meQuery.refetch();
    } catch {}
  };

  // If query errored, treat as not authenticated (not loading)
  const isLoading = meQuery.isLoading && !meQuery.isError;

  const value: AuthContextType = {
    user: meQuery.data ?? null,
    loading: isLoading,
    error: meQuery.error ?? null,
    refresh,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;
