const { getCollections } = require("../../backend_fix/config/db");

const upsertTokenSession = (userId, token, expiresAt) => {
  const { tokensCollection } = getCollections();
  return tokensCollection.findOneAndUpdate(
    { userId },
    {
      $set: {
        token,
        userId,
        expiresAt,
      },
    },
    { upsert: true }
  );
};

const findTokenSession = (token) => {
  const { tokensCollection } = getCollections();
  return tokensCollection.findOne({ token });
};

const deleteTokenSession = (token) => {
  const { tokensCollection } = getCollections();
  return tokensCollection.deleteOne({ token });
};

module.exports = {
  upsertTokenSession,
  findTokenSession,
  deleteTokenSession,
};
