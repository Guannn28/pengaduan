const express = require("express");
const {
  createUserByAdmin,
  deleteAccountRequest,
  deleteStudentAccount,
  listAccountRequests,
  listStudentAccounts,
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
router.get("/admin/users", auth(["admin"]), listStudentAccounts);
router.post("/admin/users", auth(["admin"]), createUserByAdmin);
router.delete("/admin/users/:id", auth(["admin"]), deleteStudentAccount);
router.delete("/account-requests/:id", auth(["admin"]), deleteAccountRequest);

module.exports = router;
