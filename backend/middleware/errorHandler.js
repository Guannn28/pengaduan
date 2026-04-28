const { multer } = require("./upload");

const errorHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Ukuran file maksimal 25MB." });
    }

    return res.status(400).json({ error: err.message });
  }

  if (err?.message) {
    return res.status(400).json({ error: err.message });
  }

  return next(err);
};

module.exports = {
  errorHandler,
};
