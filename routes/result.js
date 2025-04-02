import express from "express";
import {
  completeSelfTest,
  getAssessmentResults,
  getAssessmentStatuses,
  getCategoryComparison,
  getDiagnosisRounds,
  getResultByRound,
} from "../controllers/resultController.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

router.post("/complete-selftest", csrfProtection, completeSelfTest);
router.get("/assessment-results", csrfProtection, getAssessmentResults);
router.get("/assessment-statuses", csrfProtection, getAssessmentStatuses);

router.get("/rounds", csrfProtection, getDiagnosisRounds);
router.get("/round-result", csrfProtection, getResultByRound);
router.get(
  "/category-comparison/:systemId",
  csrfProtection,
  getCategoryComparison
);

export default router;
