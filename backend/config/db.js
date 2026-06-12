const { MongoClient } = require("mongodb");
const env = require("./env");

let client;
let db;
let collections;
let dbState = {
  connected: false,
  lastError: "",
  lastConnectedAt: "",
};

const getCollections = () => {
  if (!collections) {
    throw new Error("Database belum diinisialisasi.");
  }

  return collections;
};

async function initDb() {
  if (db) {
    return db;
  }

  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI wajib diset di environment.");
  }

  client = new MongoClient(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  await client.connect();
  db = client.db(env.MONGODB_DB_NAME);
  dbState = {
    connected: true,
    lastError: "",
    lastConnectedAt: new Date().toISOString(),
  };

  collections = {
    db,
    usersCollection: db.collection("users"),
    tokensCollection: db.collection("tokens"),
    complaintsCollection: db.collection("complaints"),
    accountRequestsCollection: db.collection("accountRequests"),
  };

  await collections.usersCollection.dropIndex("email_1").catch(() => {});

  await Promise.all([
    collections.usersCollection.createIndex(
      { username: 1 },
      {
        unique: true,
        partialFilterExpression: { username: { $type: "string" } },
      }
    ),
    collections.usersCollection.createIndex({ role: 1 }),
    collections.tokensCollection.createIndex({ token: 1 }, { unique: true }),
    collections.tokensCollection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    ),
    collections.complaintsCollection.createIndex({ userId: 1, createdAt: -1 }),
    collections.complaintsCollection.createIndex({ createdAt: -1 }),
    collections.complaintsCollection.createIndex({ status: 1 }),
    collections.accountRequestsCollection.createIndex(
      { username: 1, status: 1 },
      { unique: false }
    ),
    collections.accountRequestsCollection.createIndex({ createdAt: -1 }),
  ]);

  const { ensureDefaultAdmin } = require("../models/userModel");
  await ensureDefaultAdmin();

  return db;
}

const markDbDisconnected = (error) => {
  db = null;
  collections = null;
  dbState = {
    ...dbState,
    connected: false,
    lastError: error ? String(error.message || error) : "",
  };
};

const getDbState = () => dbState;

module.exports = {
  initDb,
  getCollections,
  getDbState,
  markDbDisconnected,
};
