import express from "express";
import {
  completeSelfTest,
  getAssessmentResults,
  getAssessmentStatuses,
  getCategoryProtectionScores,
} from "../controllers/resultController.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

router.post("/complete-selftest", csrfProtection, completeSelfTest);
router.get("/assessment-results", csrfProtection, getAssessmentResults);
router.get("/assessment-statuses", csrfProtection, getAssessmentStatuses);
router.get(
  "/category-protection-scores/:systemId",
  csrfProtection,
  getCategoryProtectionScores
);

export default router;
