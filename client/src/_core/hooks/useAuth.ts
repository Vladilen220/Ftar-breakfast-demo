import { getLoginUrl } from "@/const";
import { useCallback, useEffect, useMemo } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};

  const ctx = useAuthContext();

  const logout = useCallback(async () => {
    try {
      await ctx.logout();
    } catch {}
    try {
      // ensure cache invalidation
      await ctx.refresh();
    } catch {}
  }, [ctx]);

  const state = useMemo(() => {
    try {
      localStorage.setItem("auth-user-info", JSON.stringify(ctx.user));
    } catch {}

    return {
      user: ctx.user,
      loading: ctx.loading,
      error: ctx.error,
      isAuthenticated: Boolean(ctx.user),
    };
  }, [ctx.user, ctx.loading, ctx.error]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (ctx.loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, ctx.loading, state.user]);

  return {
    ...state,
    refresh: ctx.refresh,
    logout,
  };
}
