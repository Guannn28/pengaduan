const express = require("express");
const {
  createUserByAdmin,
  listAccountRequests,
  login,
  me,
  register,
} = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const { uploadStudentCard } = require("../middleware/upload");

const router = express.Router();

router.post("/register", uploadStudentCard.single("studentCard"), register);
router.post("/login", login);
router.get("/me", auth(), me);
router.get("/account-requests", auth(["admin"]), listAccountRequests);
router.post("/admin/users", auth(["admin"]), createUserByAdmin);

module.exports = router;
