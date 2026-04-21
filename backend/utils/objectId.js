const { ObjectId } = require("mongodb");

const parseObjectId = (value) => {
  if (!ObjectId.isValid(value)) return null;
  return new ObjectId(value);
};

module.exports = {
  parseObjectId,
};
