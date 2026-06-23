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

const findUsersByIds = (ids = []) => {
  const { usersCollection } = getCollections();
  const uniqueIds = [...new Map(ids.filter(Boolean).map((id) => [id.toString(), id])).values()];

  if (!uniqueIds.length) {
    return Promise.resolve([]);
  }

  return usersCollection.find({ _id: { $in: uniqueIds } }).toArray();
};

const ensureDefaultAdmin = async () => {
  const desiredUsername = env.ADMIN_USERNAME;
  const desiredPassword = env.ADMIN_PASSWORD;
  if (!desiredPassword) {
    throw new Error("ADMIN_PASSWORD wajib diset di environment.");
  }

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
};

module.exports = {
  findUserByUsername,
  findUserById,
  findUsers,
  findUsersByIds,
  createUser,
  deleteUserById,
  ensureDefaultAdmin,
};
