const { findTokenSession, deleteTokenSession } = require("../models/tokenModel");
const { findUserById } = require("../models/userModel");
const { normalizeUser } = require("../utils/serializers");

const auth = (roles = []) => async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const session = await findTokenSession(token);
    if (!session) return res.status(401).json({ error: "Sesi habis, login ulang." });

    if (new Date(session.expiresAt) < new Date()) {
      await deleteTokenSession(token);
      return res.status(401).json({ error: "Sesi habis, login ulang." });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      await deleteTokenSession(token);
      return res.status(401).json({ error: "Sesi habis, login ulang." });
    }

    const normalizedUser = normalizeUser(user);
    if (roles.length && !roles.includes(normalizedUser.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = normalizedUser;
    req.token = session.token;
    next();
  } catch (err) {
    console.error("Auth error", err);
    res.status(500).json({ error: "Autentikasi gagal." });
  }
};

module.exports = {
  auth,
};
