const env = require("../config/env");
const { getCollections } = require("../config/db");
const { generateSalt, hashPassword } = require("../utils/security");

const findUserByEmail = (email) => {
  const { usersCollection } = getCollections();
  return usersCollection.findOne({ email: String(email).trim().toLowerCase() });
};

const findAdmin = () => {
  const { usersCollection } = getCollections();
  return usersCollection.findOne({ role: "admin" });
};

const createUser = (payload) => {
  const { usersCollection } = getCollections();
  return usersCollection.insertOne(payload);
};

const updateUserById = (id, payload) => {
  const { usersCollection } = getCollections();
  return usersCollection.updateOne({ _id: id }, payload);
};

const findUserById = (id) => {
  const { usersCollection } = getCollections();
  return usersCollection.findOne({ _id: id });
};

const findUsers = (query = {}, options = {}) => {
  const { usersCollection } = getCollections();
  const cursor = usersCollection.find(query).sort(options.sort || { createdAt: -1 });

  if (options.limit) {
    cursor.limit(options.limit);
  }

  return cursor.toArray();
};

const ensureDefaultAdmin = async () => {
  const desiredEmail = env.ADMIN_EMAIL;
  const desiredPassword = env.ADMIN_PASSWORD;
  const now = new Date();
  const salt = generateSalt();
  const hash = hashPassword(desiredPassword, salt);
  const existingAdmin = await findAdmin();

  if (!existingAdmin) {
    await createUser({
      name: "Admin Kampus",
      email: desiredEmail,
      passwordHash: hash,
      salt,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Admin default dibuat email: ${desiredEmail} password: ${desiredPassword}`);
    return;
  }

  await updateUserById(existingAdmin._id, {
    $set: {
      email: desiredEmail,
      passwordHash: hash,
      salt,
      updatedAt: now,
    },
  });
  console.log(`Admin diperbarui ke email: ${desiredEmail} password: ${desiredPassword}`);
};

module.exports = {
  findUserByEmail,
  findUserById,
  findUsers,
  createUser,
  ensureDefaultAdmin,
};
