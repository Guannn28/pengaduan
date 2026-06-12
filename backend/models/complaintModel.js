const { getCollections } = require("../config/db");

const findComplaints = (query, options = {}) => {
  const { complaintsCollection } = getCollections();
  const cursor = complaintsCollection.find(query).sort(options.sort || { createdAt: -1 });

  if (options.limit) {
    cursor.limit(options.limit);
  }

  return cursor.toArray();
};

const createComplaint = (payload) => {
  const { complaintsCollection } = getCollections();
  return complaintsCollection.insertOne(payload);
};

const findComplaintById = (objectId) => {
  const { complaintsCollection } = getCollections();
  return complaintsCollection.findOne({ _id: objectId });
};

const updateComplaintById = (objectId, payload) => {
  const { complaintsCollection } = getCollections();
  return complaintsCollection.updateOne({ _id: objectId }, payload);
};

const deleteComplaintById = (objectId) => {
  const { complaintsCollection } = getCollections();
  return complaintsCollection.deleteOne({ _id: objectId });
};

const aggregateComplaintCounts = () => {
  const { complaintsCollection } = getCollections();
  return complaintsCollection
    .aggregate([{ $group: { _id: "$status", total: { $sum: 1 } } }])
    .toArray();
};

module.exports = {
  findComplaints,
  createComplaint,
  findComplaintById,
  updateComplaintById,
  deleteComplaintById,
  aggregateComplaintCounts,
};
