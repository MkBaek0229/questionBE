import express from "express";
import {
  postsystem,
  getsystems,
  getSystemById,
  updateSystem,
  deleteSystem,
  getAllSystems,
  getSystemSummary,
} from "../controllers/systemController.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

router.post("/system", csrfProtection, postsystem);
router.get("/systems", csrfProtection, getsystems);
router.get("/system/:id", csrfProtection, getSystemById);
router.put("/system/:id", csrfProtection, updateSystem);
router.delete("/system/:id", csrfProtection, deleteSystem);
router.get("/all-systems", csrfProtection, getAllSystems);
router.get("/summary", csrfProtection, getSystemSummary);

export default router;
