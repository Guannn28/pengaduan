const {
  createUser,
  deleteUserById,
  findUserById,
  findUserByUsername,
  findUsers,
} = require("../models/userModel");
const {
  createAccountRequest,
  deleteAccountRequestById,
  findAccountRequests,
  findAccountRequestById,
  findPendingAccountRequestByUsername,
  updateAccountRequestById,
} = require("../models/accountRequestModel");
const { upsertTokenSession } = require("../models/tokenModel");
const { generateSalt, generateToken, hashPassword } = require("../utils/security");
const {
  normalizeAccountRequest,
  normalizeStudentAccount,
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
    const { name, username, className, contactPhone } = req.body || {};
    if (!name || !username || !className || !contactPhone) {
      return res.status(400).json({ error: "Nama, username, kelas, dan nomor yang bisa dihubungi wajib diisi." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Foto kartu pelajar wajib diunggah." });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const existing = await findUserByUsername(normalizedUsername);
    if (existing) {
      return res.status(409).json({ error: "Username sudah memiliki akun. Silakan login." });
    }

    const pendingRequest = await findPendingAccountRequestByUsername(normalizedUsername);
    if (pendingRequest) {
      return res.status(409).json({ error: "Permohonan akun untuk username ini masih menunggu admin." });
    }

    const now = new Date();
    const payload = {
      name: String(name).trim(),
      username: normalizedUsername,
      className: String(className).trim(),
      contactPhone: String(contactPhone).trim(),
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
    const { username, password } = req.body || {};
    const normalizedUsername = String(username || "").trim().toLowerCase();
    const user = await findUserByUsername(normalizedUsername);
    if (!user) {
      return res.status(401).json({ error: "Username atau password salah." });
    }

    const hash = hashPassword(password || "", user.salt);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: "Username atau password salah." });
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

const listStudentAccounts = async (_req, res) => {
  try {
    const rows = await findUsers({ role: "student" }, { sort: { createdAt: -1 } });
    return res.json(rows.map(normalizeStudentAccount));
  } catch (err) {
    console.error("List student accounts error", err);
    return res.status(500).json({ error: "Gagal mengambil data akun siswa." });
  }
};

const createUserByAdmin = async (req, res) => {
  try {
    const { name, username, password, role, className, requestId } = req.body || {};
    const normalizedName = String(name || "").trim();
    const normalizedUsername = String(username || "").trim().toLowerCase();
    const normalizedRole = String(role || "").trim().toLowerCase();
    const normalizedClassName = String(className || "").trim();

    if (!normalizedName || !normalizedUsername || !password || !normalizedRole) {
      return res.status(400).json({ error: "Nama, username, password, dan role wajib diisi." });
    }

    if (!["student", "admin"].includes(normalizedRole)) {
      return res.status(400).json({ error: "Role tidak valid." });
    }

    if (normalizedRole === "student" && !normalizedClassName) {
      return res.status(400).json({ error: "Kelas wajib diisi untuk akun siswa." });
    }

    const existing = await findUserByUsername(normalizedUsername);
    if (existing) {
      return res.status(409).json({ error: "Username sudah terdaftar." });
    }

    const now = new Date();
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const result = await createUser({
      name: normalizedName,
      username: normalizedUsername,
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

const deleteStudentAccount = async (req, res) => {
  try {
    const objectId = parseObjectId(req.params.id);
    const existing = objectId ? await findUserById(objectId) : null;

    if (!existing) {
      return res.status(404).json({ error: "Akun siswa tidak ditemukan." });
    }

    if (existing.role !== "student") {
      return res.status(400).json({ error: "Akun admin tidak boleh dihapus dari menu ini." });
    }

    await deleteUserById(objectId);
    return res.json({ success: true, message: "Akun siswa berhasil dihapus." });
  } catch (err) {
    console.error("Delete student account error", err);
    return res.status(500).json({ error: "Gagal menghapus akun siswa." });
  }
};

const deleteAccountRequest = async (req, res) => {
  try {
    const objectId = parseObjectId(req.params.id);
    const existing = objectId ? await findAccountRequestById(objectId) : null;

    if (!existing) {
      return res.status(404).json({ error: "Permohonan akun tidak ditemukan." });
    }

    if (existing.status !== "reviewed") {
      return res
        .status(400)
        .json({ error: "Permohonan akun hanya bisa dihapus setelah akun selesai dibuat." });
    }

    await deleteAccountRequestById(objectId);
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete account request error", err);
    return res.status(500).json({ error: "Gagal menghapus permohonan akun." });
  }
};

module.exports = {
  register,
  login,
  me,
  listAccountRequests,
  listStudentAccounts,
  createUserByAdmin,
  deleteStudentAccount,
  deleteAccountRequest,
};
