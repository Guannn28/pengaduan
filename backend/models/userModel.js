const env = require("../config/env");
const { getCollections } = require("../config/db");
const { generateSalt, hashPassword } = require("../utils/security");

const normalizeUsername = (username) => String(username || "").trim().toLowerCase();

const findUserByUsername = (username) => {
  const { usersCollection } = getCollections();
  const normalized = normalizeUsername(username);
  return usersCollection.findOne({
    $or: [{ username: normalized }, { email: normalized }],
  });
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

const deleteUserById = (id) => {
  const { usersCollection } = getCollections();
  return usersCollection.deleteOne({ _id: id });
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
  const desiredUsername = env.ADMIN_USERNAME;
  const desiredPassword = env.ADMIN_PASSWORD;
  const now = new Date();
  const salt = generateSalt();
  const hash = hashPassword(desiredPassword, salt);
  const existingAdmin = await findAdmin();

  if (!existingAdmin) {
    await createUser({
      name: "Admin Sekolah",
      username: desiredUsername,
      passwordHash: hash,
      salt,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Admin default dibuat username: ${desiredUsername} password: ${desiredPassword}`);
    return;
  }

  await updateUserById(existingAdmin._id, {
    $set: {
      name: "Admin Sekolah",
      username: desiredUsername,
      passwordHash: hash,
      salt,
      updatedAt: now,
    },
  });
  console.log(`Admin diperbarui ke username: ${desiredUsername} password: ${desiredPassword}`);
};

module.exports = {
  findUserByUsername,
  findUserById,
  findUsers,
  createUser,
  deleteUserById,
  ensureDefaultAdmin,
};
