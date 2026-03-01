import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DB_NAME || "ftarapp";

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);

    cachedClient = client;
    cachedDb = db;

    console.log("[MongoDB] Connected to database:", DATABASE_NAME);
    return { client, db };
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error);
    throw error;
  }
}

export async function getDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const { db } = await connectToDatabase();
  return db;
}

// Collection references
export async function getCollections() {
  const db = await getDatabase();
  return {
    orders: db.collection("breakfast_orders"),
    menu: db.collection("breakfast_menu"),
    users: db.collection("breakfast_users"),
    settings: db.collection("breakfast_settings"),
    shared: db.collection("breakfast_shared"),
    dev: db.collection("breakfast_dev"),
  };
}

/**
 * Initialize MongoDB indexes for multi-tenant support
 * Call this once on application startup
 */
export async function initializeIndexes() {
  try {
    const db = await getDatabase();
    
    // breakfast_orders indexes
    const ordersCol = db.collection("breakfast_orders");
    await ordersCol.createIndex({ companyId: 1, date: 1 });
    await ordersCol.createIndex({ companyId: 1, username: 1, date: 1 });
    
    // breakfast_menu indexes (per-company menu)
    const menuCol = db.collection("breakfast_menu");
    await menuCol.createIndex({ companyId: 1, name: 1 });
    
    // breakfast_shared indexes
    const sharedCol = db.collection("breakfast_shared");
    await sharedCol.createIndex({ companyId: 1, date: 1 });
    await sharedCol.createIndex({ companyId: 1, item: 1, date: 1 });
    
    // breakfast_dev indexes
    const devCol = db.collection("breakfast_dev");
    await devCol.createIndex({ companyId: 1, date: 1 });
    await devCol.createIndex({ companyId: 1, username: 1, date: 1 });
    
    // breakfast_users indexes (for company user management)
    const usersCol = db.collection("breakfast_users");
    await usersCol.createIndex({ companyId: 1, username: 1 });
    
    console.log("[MongoDB] Indexes initialized successfully");
  } catch (error) {
    console.error("[MongoDB] Failed to initialize indexes:", error);
    // Don't fail startup on index creation errors
  }
}
