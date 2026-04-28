const { MongoClient } = require("mongodb");
const env = require("./env");

let db;
let usersCollection;
let tokensCollection;
let complaintsCollection;
let accountRequestsCollection;

const getCollections = () => {
  if (!db) {
    throw new Error("Database belum diinisialisasi.");
  }

  return {
    db,
    usersCollection,
    tokensCollection,
    complaintsCollection,
    accountRequestsCollection,
  };
};

async function initDb() {
  try {
    if (!env.MONGODB_URI) {
      throw new Error("MONGODB_URI belum diset di ENV");
    }

    console.log("Connecting to MongoDB...");
    console.log("URI:", env.MONGODB_URI); // debug (hapus kalau udah aman)

    const client = new MongoClient(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();

    db = client.db(env.MONGODB_DB_NAME);

    usersCollection = db.collection("users");
    tokensCollection = db.collection("tokens");
    complaintsCollection = db.collection("complaints");
    accountRequestsCollection = db.collection("accountRequests");

    await Promise.all([
      usersCollection.createIndex({ email: 1 }, { unique: true }),
      usersCollection.createIndex({ role: 1 }),
      tokensCollection.createIndex({ token: 1 }, { unique: true }),
      tokensCollection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
      ),
      complaintsCollection.createIndex({ userId: 1, createdAt: -1 }),
      complaintsCollection.createIndex({ createdAt: -1 }),
      complaintsCollection.createIndex({ status: 1 }),
      accountRequestsCollection.createIndex({ email: 1, status: 1 }),
      accountRequestsCollection.createIndex({ createdAt: -1 }),
    ]);

    const { ensureDefaultAdmin } = require("../models/userModel");
    await ensureDefaultAdmin();

    console.log(
      `✅ MongoDB connected (DB: ${env.MONGODB_DB_NAME})`
    );
  } catch (err) {
    console.error("❌ Gagal inisialisasi database:", err.message);
    process.exit(1); // biar Railway tau app gagal
  }
}

module.exports = {
  initDb,
  getCollections,
};