const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/complaints_db";
const MONGODB_DB_NAME =
  process.env.MONGODB_DB_NAME ||
  (() => {
    try {
      const pathname = new URL(MONGODB_URI).pathname.replace(/^\/+/, "");
      return pathname || "complaints_db";
    } catch {
      return "complaints_db";
    }
  })();

let db;
let usersCollection;
let tokensCollection;
let complaintsCollection;
const uploadsPath = path.join(__dirname, "uploads");
const complaintEvidencePath = path.join(uploadsPath, "complaints");

const complaintCategories = [
  "Sarana dan Prasarana",
  "Akademik",
  "Kasus Pembulian",
  "Administrasi",
  "Lainnya",
];

const complaintStatuses = ["submitted", "in_progress", "resolved", "rejected"];
const allowedEvidenceMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

fs.mkdirSync(complaintEvidencePath, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, complaintEvidencePath);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "");
    cb(
      null,
      `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`
    );
  },
});

const uploadEvidence = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedEvidenceMimeTypes.has(file.mimetype)) {
      cb(new Error("Format bukti harus berupa foto atau video yang didukung."));
      return;
    }
    cb(null, true);
  },
});

const hashPassword = (password, salt) =>
  crypto.createHash("sha256").update(password + salt).digest("hex");

const normalizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

const normalizeComplaint = (complaint) => ({
  id: complaint._id.toString(),
  userId: complaint.userId ? complaint.userId.toString() : null,
  name: complaint.name,
  email: complaint.email,
  category: complaint.category,
  message: complaint.message,
  evidenceUrl: complaint.evidenceUrl || "",
  evidenceType: complaint.evidenceType || "",
  evidenceName: complaint.evidenceName || "",
  status: complaint.status,
  createdAt: complaint.createdAt,
  updatedAt: complaint.updatedAt,
});

const parseObjectId = (value) => {
  if (!ObjectId.isValid(value)) return null;
  return new ObjectId(value);
};

async function initDb() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  db = client.db(MONGODB_DB_NAME);
  usersCollection = db.collection("users");
  tokensCollection = db.collection("tokens");
  complaintsCollection = db.collection("complaints");

  await Promise.all([
    usersCollection.createIndex({ email: 1 }, { unique: true }),
    usersCollection.createIndex({ role: 1 }),
    tokensCollection.createIndex({ token: 1 }, { unique: true }),
    tokensCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    complaintsCollection.createIndex({ userId: 1, createdAt: -1 }),
    complaintsCollection.createIndex({ createdAt: -1 }),
    complaintsCollection.createIndex({ status: 1 }),
  ]);

  await ensureDefaultAdmin();
  console.log(`MongoDB ready on ${MONGODB_URI} (db: ${MONGODB_DB_NAME})`);
}

const createToken = async (userId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);

  await tokensCollection.findOneAndUpdate(
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

  return { token, expiresAt };
};

const findUserByToken = async (token) => {
  const session = await tokensCollection.findOne({ token });
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    await tokensCollection.deleteOne({ token });
    return null;
  }

  const user = await usersCollection.findOne({ _id: session.userId });
  if (!user) {
    await tokensCollection.deleteOne({ token });
    return null;
  }

  return {
    token: session.token,
    user: normalizeUser(user),
  };
};

const ensureDefaultAdmin = async () => {
  const desiredEmail = (process.env.ADMIN_EMAIL || "admin@ubl.ac.id").trim().toLowerCase();
  const desiredPassword = process.env.ADMIN_PASSWORD || "admin123";
  const now = new Date();
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(desiredPassword, salt);
  const existingAdmin = await usersCollection.findOne({ role: "admin" });

  if (!existingAdmin) {
    await usersCollection.insertOne({
      name: "Admin Kampus",
      email: desiredEmail,
      passwordHash: hash,
      salt,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Admin default dibuat email: ${desiredEmail} password: ${desiredPassword}`);
    return;
  }

  await usersCollection.updateOne(
    { _id: existingAdmin._id },
    {
      $set: {
        email: desiredEmail,
        passwordHash: hash,
        salt,
        updatedAt: now,
      },
    }
  );
  console.log(`Admin diperbarui ke email: ${desiredEmail} password: ${desiredPassword}`);
};

const findUserByEmail = async (email) =>
  usersCollection.findOne({ email: String(email).trim().toLowerCase() });

const getComplaintById = async (id) => {
  const objectId = parseObjectId(id);
  if (!objectId) return null;
  return complaintsCollection.findOne({ _id: objectId });
};

const removeLocalEvidence = (evidenceUrl) => {
  if (!evidenceUrl || !evidenceUrl.startsWith("/uploads/")) return;

  const relativePath = evidenceUrl.replace(/^\/uploads\//, "");
  const targetPath = path.join(uploadsPath, relativePath);
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
};

const getLocalEvidencePath = (evidenceUrl) => {
  if (!evidenceUrl || !evidenceUrl.startsWith("/uploads/")) return null;

  const relativePath = evidenceUrl.replace(/^\/uploads\//, "");
  const targetPath = path.resolve(uploadsPath, relativePath);
  const uploadsRoot = `${path.resolve(uploadsPath)}${path.sep}`;

  if (!targetPath.startsWith(uploadsRoot)) {
    return null;
  }

  return targetPath;
};

const auth = (roles = []) => async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const session = await findUserByToken(token);
    if (!session) return res.status(401).json({ error: "Sesi habis, login ulang." });
    if (roles.length && !roles.includes(session.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = session.user;
    req.token = session.token;
    next();
  } catch (err) {
    console.error("Auth error", err);
    res.status(500).json({ error: "Autentikasi gagal." });
  }
};

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsPath));

app.get("/api/health", async (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post("/api/register", async (req, res) => {
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
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);

    const result = await usersCollection.insertOne({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      salt,
      role: "student",
      createdAt: now,
      updatedAt: now,
    });

    const { token, expiresAt } = await createToken(result.insertedId);
    res.status(201).json({
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
    res.status(500).json({ error: "Gagal mendaftar." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || "").toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) return res.status(401).json({ error: "Email atau password salah." });

    const hash = hashPassword(password || "", user.salt);
    if (hash !== user.passwordHash)
      return res.status(401).json({ error: "Email atau password salah." });

    const { token, expiresAt } = await createToken(user._id);
    res.json({
      token,
      expiresAt,
      user: normalizeUser(user),
    });
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ error: "Gagal login." });
  }
});

app.get("/api/me", auth(), async (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/complaints", auth(), async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? {}
        : { userId: parseObjectId(req.user.id) };
    const rows = await complaintsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    res.json(rows.map(normalizeComplaint));
  } catch (err) {
    console.error("List complaints error", err);
    res.status(500).json({ error: "Gagal mengambil pengaduan." });
  }
});

app.post(
  "/api/complaints",
  auth(["student", "admin"]),
  uploadEvidence.single("evidence"),
  async (req, res) => {
    try {
      const { category, message } = req.body || {};

      if (!category || !message) {
        return res.status(400).json({ error: "Kategori dan pesan wajib diisi." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Bukti foto atau video wajib diunggah." });
      }

      const normalizedCategory = String(category).trim();
      if (!complaintCategories.includes(normalizedCategory)) {
        return res.status(400).json({ error: "Kategori tidak valid." });
      }

      const now = new Date();
      const result = await complaintsCollection.insertOne({
        userId: parseObjectId(req.user.id),
        name: req.user.name,
        email: req.user.email,
        category: normalizedCategory,
        message: String(message).trim(),
        evidenceUrl: `/uploads/complaints/${req.file.filename}`,
        evidenceType: req.file.mimetype,
        evidenceName: req.file.originalname,
        status: "submitted",
        createdAt: now,
        updatedAt: now,
      });

      const created = await getComplaintById(result.insertedId.toString());
      res.status(201).json(normalizeComplaint(created));
    } catch (err) {
      console.error("Create complaint error", err);
      res.status(500).json({ error: "Gagal membuat pengaduan." });
    }
  }
);

app.patch("/api/complaints/:id/status", auth(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!complaintStatuses.includes(status)) {
      return res.status(400).json({ error: "Status tidak valid." });
    }

    const existing = await getComplaintById(id);
    if (!existing) {
      return res.status(404).json({ error: "Pengaduan tidak ditemukan." });
    }

    await complaintsCollection.updateOne(
      { _id: parseObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    const updated = await getComplaintById(id);
    res.json(normalizeComplaint(updated));
  } catch (err) {
    console.error("Update status error", err);
    res.status(500).json({ error: "Gagal memperbarui status." });
  }
});

app.get("/api/complaints/:id/evidence/download", auth(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await getComplaintById(id);

    if (!complaint) {
      return res.status(404).json({ error: "Pengaduan tidak ditemukan." });
    }

    if (!complaint.evidenceUrl) {
      return res.status(404).json({ error: "File bukti tidak tersedia." });
    }

    const evidencePath = getLocalEvidencePath(complaint.evidenceUrl);
    if (!evidencePath || !fs.existsSync(evidencePath)) {
      return res.status(404).json({ error: "File bukti tidak ditemukan di server." });
    }

    res.download(evidencePath, complaint.evidenceName || path.basename(evidencePath));
  } catch (err) {
    console.error("Download evidence error", err);
    res.status(500).json({ error: "Gagal mengunduh file bukti." });
  }
});

app.delete("/api/complaints/:id", auth(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getComplaintById(id);
    if (!existing) return res.status(404).json({ error: "Pengaduan tidak ditemukan." });
    await complaintsCollection.deleteOne({ _id: parseObjectId(id) });
    removeLocalEvidence(existing.evidenceUrl);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete complaint error", err);
    res.status(500).json({ error: "Gagal menghapus pengaduan." });
  }
});

app.get("/api/stats", auth(["admin"]), async (_req, res) => {
  try {
    const countsRows = await complaintsCollection
      .aggregate([{ $group: { _id: "$status", total: { $sum: 1 } } }])
      .toArray();
    const counts = countsRows.reduce((acc, row) => {
      acc[row._id] = row.total;
      return acc;
    }, {});

    const latestRows = await complaintsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    const latest = latestRows.map(normalizeComplaint);

    res.json({ counts, latest });
  } catch (err) {
    console.error("Stats error", err);
    res.status(500).json({ error: "Gagal mengambil statistik." });
  }
});

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Ukuran file maksimal 25MB." });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err?.message) {
    return res.status(400).json({ error: err.message });
  }

  next(err);
});

// Serve built frontend when available
const distPath = path.join(__dirname, "client", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Bootstrap server only after DB ready
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Gagal inisialisasi database", err);
    process.exit(1);
  });
