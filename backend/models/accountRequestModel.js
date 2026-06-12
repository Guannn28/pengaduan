const { getCollections } = require("../config/db");

const createAccountRequest = (payload) => {
  const { accountRequestsCollection } = getCollections();
  return accountRequestsCollection.insertOne(payload);
};

const findAccountRequests = (query = {}, options = {}) => {
  const { accountRequestsCollection } = getCollections();
  const cursor = accountRequestsCollection.find(query).sort(options.sort || { createdAt: -1 });

  if (options.limit) {
    cursor.limit(options.limit);
  }

  return cursor.toArray();
};

const findPendingAccountRequestByUsername = (username) => {
  const { accountRequestsCollection } = getCollections();
  const normalized = String(username || "").trim().toLowerCase();
  return accountRequestsCollection.findOne({
    $or: [{ username: normalized }, { email: normalized }],
    status: "pending",
  });
};

const updateAccountRequestById = (objectId, payload) => {
  const { accountRequestsCollection } = getCollections();
  return accountRequestsCollection.updateOne({ _id: objectId }, payload);
};

const findAccountRequestById = (objectId) => {
  const { accountRequestsCollection } = getCollections();
  return accountRequestsCollection.findOne({ _id: objectId });
};

const deleteAccountRequestById = (objectId) => {
  const { accountRequestsCollection } = getCollections();
  return accountRequestsCollection.deleteOne({ _id: objectId });
};

module.exports = {
  createAccountRequest,
  findAccountRequests,
  findPendingAccountRequestByUsername,
  findAccountRequestById,
  deleteAccountRequestById,
  updateAccountRequestById,
};
