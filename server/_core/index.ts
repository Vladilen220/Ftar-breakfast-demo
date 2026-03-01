import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import session from "express-session";
import MongoStore from "connect-mongo";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeEmailTransport } from "./email";
import { initializeIndexes } from "../mongodb";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }

  // Initialize email transport before starting server
  await initializeEmailTransport();
  
  // Initialize MongoDB indexes for multi-tenant support
  await initializeIndexes();

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Configure express-session for authentication
  const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessions",
    ttl: 60 * 60 * 2, // 2 hours in seconds
  });

  // connect-mongo may throw when touching a stale/missing session id.
  // Treat this as non-fatal and let a fresh session be created normally.
  const originalTouch = (sessionStore as any).touch?.bind(sessionStore);
  if (originalTouch) {
    (sessionStore as any).touch = (sid: string, sess: any, cb: (err?: any) => void) => {
      originalTouch(sid, sess, (err: any) => {
        const message = String(err?.message || "");
        if (err && message.includes("Unable to find the session to touch")) {
          return cb?.();
        }
        cb?.(err);
      });
    };
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      // Persist sessions in MongoDB so they survive server restarts
      store: sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 2, // 2 hours
      },
    })
  );

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
