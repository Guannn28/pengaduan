const { getCollections } = require("../../backend_fix/config/db");

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

const findPendingAccountRequestByEmail = (email) => {
  const { accountRequestsCollection } = getCollections();
  return accountRequestsCollection.findOne({
    email: String(email).trim().toLowerCase(),
    status: "pending",
  });
};

const updateAccountRequestById = (objectId, payload) => {
  const { accountRequestsCollection } = getCollections();
  return accountRequestsCollection.updateOne({ _id: objectId }, payload);
};

module.exports = {
  createAccountRequest,
  findAccountRequests,
  findPendingAccountRequestByEmail,
  updateAccountRequestById,
};
