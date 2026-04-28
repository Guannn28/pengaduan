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
  const { ensureDefaultAdmin } = require("../models/userModel");
  const client = new MongoClient(env.MONGODB_URI);
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
    tokensCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    complaintsCollection.createIndex({ userId: 1, createdAt: -1 }),
    complaintsCollection.createIndex({ createdAt: -1 }),
    complaintsCollection.createIndex({ status: 1 }),
    accountRequestsCollection.createIndex({ email: 1, status: 1 }),
    accountRequestsCollection.createIndex({ createdAt: -1 }),
  ]);

  await ensureDefaultAdmin();
  console.log(`MongoDB ready on ${env.MONGODB_URI} (db: ${env.MONGODB_DB_NAME})`);
}

module.exports = {
  initDb,
  getCollections,
};
