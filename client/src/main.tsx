import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import "./index.css";

console.log("[Main] Starting application...");

const queryClient = new QueryClient();

async function bootstrap() {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

  console.log("[Main] Demo mode:", isDemoMode);

  if (isDemoMode) {
    if (typeof document !== "undefined") {
      document.title = "طلب الفطار • DEMO";
    }

    const { default: DemoApp } = await import("./DemoApp");
    createRoot(document.getElementById("root")!).render(
      <QueryClientProvider client={queryClient}>
        <DemoApp />
      </QueryClientProvider>
    );
    return;
  }

  const [{ trpc }, { UNAUTHED_ERR_MSG }, trpcClientModule, { default: superjson }, { default: App }, { getLoginUrl }] = await Promise.all([
    import("@/lib/trpc"),
    import("@shared/const"),
    import("@trpc/client"),
    import("superjson"),
    import("./App"),
    import("./const"),
  ]);

  const redirectToLoginIfUnauthorized = (error: unknown) => {
    if (!(error instanceof trpcClientModule.TRPCClientError)) return;
    if (typeof window === "undefined") return;

    const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

    if (!isUnauthorized) return;

    window.location.href = getLoginUrl();
  };

  queryClient.getQueryCache().subscribe(event => {
    if (event.type === "updated" && event.action.type === "error") {
      const error = event.query.state.error;
      redirectToLoginIfUnauthorized(error);
      console.error("[API Query Error]", error);
    }
  });

  queryClient.getMutationCache().subscribe(event => {
    if (event.type === "updated" && event.action.type === "error") {
      const error = event.mutation.state.error;
      redirectToLoginIfUnauthorized(error);
      console.error("[API Mutation Error]", error);
    }
  });

  const trpcClient = trpc.createClient({
    links: [
      trpcClientModule.httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch(input, init) {
          return globalThis.fetch(input, {
            ...(init ?? {}),
            credentials: "include",
          });
        },
      }),
    ],
  });

  createRoot(document.getElementById("root")!).render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

console.log("[Main] Root element:", document.getElementById("root"));
console.log("[Main] Rendering React app...");

void bootstrap();
