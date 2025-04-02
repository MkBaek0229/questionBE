import express from "express";
import { checkSession } from "../controllers/sessionController.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

// 통합 세션 체크 엔드포인트
router.get("/check", csrfProtection, checkSession);

export default router;
