const { createUser, findUserByEmail } = require("../models/userModel");
const { upsertTokenSession } = require("../models/tokenModel");
const { generateSalt, generateToken, hashPassword } = require("../utils/security");
const { normalizeUser } = require("../utils/serializers");

const createSession = async (userId) => {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);

  await upsertTokenSession(userId, token, expiresAt);
  return { token, expiresAt };
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nama, email, dan password wajib." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "Email sudah terdaftar." });
    }

    const now = new Date();
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const result = await createUser({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      salt,
      role: "student",
      createdAt: now,
      updatedAt: now,
    });

    const { token, expiresAt } = await createSession(result.insertedId);
    return res.status(201).json({
      token,
      expiresAt,
      user: {
        id: result.insertedId.toString(),
        name: String(name).trim(),
        email: normalizedEmail,
        role: "student",
      },
    });
  } catch (err) {
    console.error("Register error", err);
    return res.status(500).json({ error: "Gagal mendaftar." });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || "").toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const hash = hashPassword(password || "", user.salt);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const { token, expiresAt } = await createSession(user._id);
    return res.json({
      token,
      expiresAt,
      user: normalizeUser(user),
    });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({ error: "Gagal login." });
  }
};

const me = async (req, res) => res.json({ user: req.user });

module.exports = {
  register,
  login,
  me,
};
