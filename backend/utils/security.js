const crypto = require("crypto");

const hashPassword = (password, salt) =>
  crypto.createHash("sha256").update(password + salt).digest("hex");

const generateSalt = () => crypto.randomBytes(16).toString("hex");
const generateToken = () => crypto.randomBytes(32).toString("hex");
const generateFilenameToken = () => crypto.randomBytes(8).toString("hex");

module.exports = {
  hashPassword,
  generateSalt,
  generateToken,
  generateFilenameToken,
};
