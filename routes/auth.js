import express from "express";
import {
  register,
  login,
  logout,
  getUserInfo,
} from "../controllers/authController.js";
import validateUserInput from "../middlewares/validation.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

router.post("/register", validateUserInput, csrfProtection, register);
router.post("/login", csrfProtection, login);
router.post("/logout", csrfProtection, logout);
router.get("/user", getUserInfo);

export default router;
