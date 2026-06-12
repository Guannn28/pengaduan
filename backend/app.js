const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const { distPath, uploadsPath } = require("./paths");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const datasetRoutes = require("./routes/datasetRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(uploadsPath));

app.use("/api", authRoutes);
app.use("/api", complaintRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/dataset", datasetRoutes);

app.use(errorHandler);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

module.exports = app;
