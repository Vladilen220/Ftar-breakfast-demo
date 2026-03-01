import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DB_NAME || "ftarapp";

async function seedTestData() {
  if (!MONGODB_URI) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    
    console.log("🌱 Seeding demo test data...\n");

    // Get collections
    const orders = db.collection("orders");
    const shared = db.collection("shared");
    const menu = db.collection("menu");

    // Demo users
    const demoUsers = [
      { username: "demo_user_1" },
      { username: "demo_user_2" },
      { username: "demo_user_3" },
      { username: "demo_user_4" },
      { username: "demo_user_5" },
    ];

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Clear existing orders for today only
    await orders.deleteMany({ date: today });
    await shared.deleteMany({ date: today });

    console.log(`Clearing existing orders for ${today}\n`);

    // Ensure menu items exist
    let menuItems = await menu.find({}).toArray();
    console.log(`📋 Found ${menuItems.length} menu items`);

    if (menuItems.length === 0) {
      console.log("Creating default menu items...");
      const defaultMenu = [
        { name: "فول", price: 8, shared: false },
        { name: "قشرية", price: 5, shared: false },
        { name: "طعمية", price: 6, shared: false },
        { name: "كنافة", price: 12, shared: true },
        { name: "عيش", price: 2, shared: false },
        { name: "جبن", price: 7, shared: false },
        { name: "مربى", price: 4, shared: false },
      ];
      await menu.insertMany(defaultMenu);
      console.log(`✅ Created ${defaultMenu.length} menu items`);
      menuItems = await menu.find({}).toArray();
    }

    console.log(`📋 Total menu items: ${menuItems.length}\n`);

    // Separate shared and non-shared items
    const nonSharedItems = menuItems.filter((m: any) => !m.shared);
    const sharedItems = menuItems.filter((m: any) => m.shared);

    console.log(`📊 Adding orders for ${demoUsers.length} demo users...\n`);

    let totalOrders = 0;
    let totalItems = 0;

    // Add orders for each demo user
    for (const demoUser of demoUsers) {
      const username = demoUser.username;
      const userOrders = [];
      let userTotal = 0;

      // Add 2-4 non-shared items
      const numNonShared = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < numNonShared; i++) {
        const item = nonSharedItems[Math.floor(Math.random() * nonSharedItems.length)];
        const count = Math.floor(Math.random() * 3) + 1; // 1-3 items
        
        userOrders.push({
          item: item.name,
          count,
          price: item.price,
          shared: false,
        });
        userTotal += count * item.price;
        totalItems += count;
      }

      // Randomly add 1 shared item (50% chance)
      if (sharedItems.length > 0 && Math.random() > 0.5) {
        const sharedItem = sharedItems[Math.floor(Math.random() * sharedItems.length)];
        userOrders.push({
          item: sharedItem.name,
          count: 1,
          price: sharedItem.price,
          shared: true,
        });
        totalItems += 1;

        // Track shared item participation
        const existingShared = await shared.findOne({
          item: sharedItem.name,
          date: today,
        });

        if (existingShared) {
          if (!existingShared.participants.includes(username)) {
            await shared.updateOne(
              { _id: existingShared._id },
              { $push: { participants: username } } as any
            );
          }
        } else {
          await shared.insertOne({
            item: sharedItem.name,
            date: today,
            participants: [username],
          });
        }
      }

      // Save order
      await orders.insertOne({
        username,
        date: today,
        orders: userOrders,
      });

      totalOrders += userOrders.length;

      // Print user's order summary
      console.log(`👤 ${username}:`);
      for (const order of userOrders) {
        const itemType = order.shared ? "🔄" : "📦";
        const itemTotal = order.count * order.price;
        console.log(`   ${itemType} ${order.item}: ${order.count}x ${order.price} = ${itemTotal} SR`);
      }
      console.log();
    }

    console.log("✅ Test data seeded successfully!\n");
    console.log("📈 Summary:");
    console.log(`   Total users: ${demoUsers.length}`);
    console.log(`   Total orders added: ${totalOrders}`);
    console.log(`   Total items: ${totalItems}`);
    console.log(`   Date: ${today}`);
    console.log("\n🌐 You can now:");
    console.log("   1. Login with any demo account configured in your users collection");
    demoUsers.forEach(u => {
      console.log(`      ✓ ${u.username}`);
    });
    console.log("   2. Click 📊 عرض الملخص (Summary)");
    console.log("   3. View all orders with calculations\n");

  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedTestData();
