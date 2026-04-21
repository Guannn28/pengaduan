const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/complaints_db";
const MONGODB_DB_NAME =
  process.env.MONGODB_DB_NAME ||
  (() => {
    try {
      const pathname = new URL(MONGODB_URI).pathname.replace(/^\/+/, "");
      return pathname || "complaints_db";
    } catch {
      return "complaints_db";
    }
  })();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@ubl.ac.id").trim().toLowerCase();
  const pwd = process.env.ADMIN_PASSWORD || "admin123";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(pwd + salt).digest("hex");

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const users = client.db(MONGODB_DB_NAME).collection("users");
  const result = await users.updateOne(
    { role: "admin" },
    {
      $set: {
        email,
        passwordHash: hash,
        salt,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        name: "Admin Kampus",
        role: "admin",
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  console.log("Admin updated to", email, "matched:", result.matchedCount, "upserted:", !!result.upsertedId);
  await client.close();
}

main().catch((error) => {
  console.error("Gagal update admin:", error);
  process.exit(1);
});
