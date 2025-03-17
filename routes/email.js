import express from "express";
import {
  sendVerificationCode,
  verifyCode,
  findPassword,
  resetPassword,
} from "../controllers/emailController.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

router.post("/send-verification-code", csrfProtection, sendVerificationCode);
router.post("/verify-code", csrfProtection, verifyCode);
router.post("/find-password", csrfProtection, findPassword);
router.post("/reset-password", csrfProtection, resetPassword);

export default router;
