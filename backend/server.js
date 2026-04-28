const express = require("express");
const { initDb } = require("./config/db");
const authRoutes = require("./routes/auth");

app.use("/api", authRoutes);

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server hidup 🚀");
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await initDb();
    console.log("DB connected");
  } catch (err) {
    console.error("DB gagal:", err.message);
    // tetap lanjut supaya server hidup
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();