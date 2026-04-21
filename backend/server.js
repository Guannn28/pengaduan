const app = require("./app");
const env = require("./config/env");
const { initDb } = require("./config/db");

initDb()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Server berjalan di http://localhost:${env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Gagal inisialisasi database", err);
    process.exit(1);
  });
