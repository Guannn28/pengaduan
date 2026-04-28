const {
  createUser,
  findUserByEmail,
  findUsers,
} = require("../models/userModel");
const {
  createAccountRequest,
  findAccountRequests,
  findPendingAccountRequestByEmail,
  updateAccountRequestById,
} = require("../models/accountRequestModel");
const { upsertTokenSession } = require("../models/tokenModel");
const { generateSalt, generateToken, hashPassword } = require("../utils/security");
const {
  normalizeAccountRequest,
  normalizeUser,
} = require("../utils/serializers");
const { parseObjectId } = require("../utils/objectId");

const createSession = async (userId) => {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);

  await upsertTokenSession(userId, token, expiresAt);
  return { token, expiresAt };
};

const register = async (req, res) => {
  try {
    const { name, email, className } = req.body || {};
    if (!name || !email || !className) {
      return res.status(400).json({ error: "Nama, email, dan kelas wajib diisi." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Foto kartu pelajar wajib diunggah." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "Email sudah memiliki akun. Silakan login." });
    }

    const pendingRequest = await findPendingAccountRequestByEmail(normalizedEmail);
    if (pendingRequest) {
      return res.status(409).json({ error: "Permohonan akun untuk email ini masih menunggu admin." });
    }

    const now = new Date();
    const payload = {
      name: String(name).trim(),
      email: normalizedEmail,
      className: String(className).trim(),
      studentCardUrl: `/uploads/account-requests/${req.file.filename}`,
      studentCardType: req.file.mimetype,
      studentCardName: req.file.originalname,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const result = await createAccountRequest(payload);
    return res.status(201).json({
      message: "Permohonan akun berhasil dikirim. Tunggu admin membuatkan akun Anda.",
      request: normalizeAccountRequest({
        _id: result.insertedId,
        ...payload,
      }),
    });
  } catch (err) {
    console.error("Register error", err);
    return res.status(500).json({ error: "Gagal mengirim permohonan akun." });
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

const listAccountRequests = async (_req, res) => {
  try {
    const rows = await findAccountRequests({}, { sort: { createdAt: -1 } });
    return res.json(rows.map(normalizeAccountRequest));
  } catch (err) {
    console.error("List account requests error", err);
    return res.status(500).json({ error: "Gagal mengambil permohonan akun." });
  }
};

const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, role, className, requestId } = req.body || {};
    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedRole = String(role || "").trim().toLowerCase();
    const normalizedClassName = String(className || "").trim();

    if (!normalizedName || !normalizedEmail || !password || !normalizedRole) {
      return res.status(400).json({ error: "Nama, email, password, dan role wajib diisi." });
    }

    if (!["student", "admin"].includes(normalizedRole)) {
      return res.status(400).json({ error: "Role tidak valid." });
    }

    if (normalizedRole === "student" && !normalizedClassName) {
      return res.status(400).json({ error: "Kelas wajib diisi untuk akun siswa." });
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "Email sudah terdaftar." });
    }

    const now = new Date();
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const result = await createUser({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      salt,
      role: normalizedRole,
      className: normalizedRole === "student" ? normalizedClassName : "",
      createdAt: now,
      updatedAt: now,
    });

    if (requestId) {
      const requestObjectId = parseObjectId(requestId);
      if (requestObjectId) {
        await updateAccountRequestById(requestObjectId, {
          $set: {
            status: "reviewed",
            reviewedAt: now,
            reviewedBy: req.user.id,
            updatedAt: now,
          },
        });
      }
    }

    const [createdUser] = await findUsers({ _id: result.insertedId }, { limit: 1 });
    return res.status(201).json({
      message: "Akun berhasil dibuat oleh admin.",
      user: normalizeUser(createdUser),
    });
  } catch (err) {
    console.error("Create user by admin error", err);
    return res.status(500).json({ error: "Gagal membuat akun." });
  }
};

module.exports = {
  register,
  login,
  me,
  listAccountRequests,
  createUserByAdmin,
};
