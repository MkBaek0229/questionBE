import express from "express";
import {
  registerExpert,
  loginExpert,
  logoutExpert,
  getExpertInfo,
  getAllExperts,
} from "../controllers/expertController.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

router.post("/register", csrfProtection, registerExpert);
router.post("/login", csrfProtection, loginExpert);
router.post("/logout", csrfProtection, logoutExpert);
router.get("/info", getExpertInfo);
router.get("/all", getAllExperts);

export default router;
