import express from "express";
import { requireAuth } from "../middlewares/auth.js";

import {
  handleSelfAssessmentSave,
  submitQuantitativeResponses,
  submitQualitativeResponses,
  getQuantitativeQuestions,
  getQualitativeQuestions,
  getQuantitativeResponses,
  getQualitativeResponses,
  updateQuantitativeQuestion,
  updateQualitativeQuestion,
  getNextDiagnosisRound,
  getDiagnosisRounds,
} from "../controllers/selftestController.js";
import csrfProtection from "../middlewares/csrf.js";
import { requireSuperUser } from "../middlewares/auth.js";
import { getDiagnosisRoundsService } from "../services/selftestService.js";

const router = express.Router();

router.post("/self-assessment", requireAuth, handleSelfAssessmentSave);

router.post(
  "/quantitative-responses",
  csrfProtection,
  submitQuantitativeResponses
);
router.post(
  "/qualitative-responses",
  csrfProtection,
  submitQualitativeResponses
);
router.get("/diagnosis-rounds/:systemId", csrfProtection, getDiagnosisRounds);
router.get("/quantitative-questions", csrfProtection, getQuantitativeQuestions);
router.get("/qualitative-questions", csrfProtection, getQualitativeQuestions);
router.get(
  "/quantitative-responses/:systemId",
  csrfProtection,
  getQuantitativeResponses
);
router.get(
  "/qualitative-responses/:systemId",
  csrfProtection,
  getQualitativeResponses
);
router.put(
  "/quantitative-question",
  csrfProtection,
  requireSuperUser,
  updateQuantitativeQuestion
);
router.put(
  "/qualitative-question",
  csrfProtection,
  requireSuperUser,
  updateQualitativeQuestion
);

router.get("/round/:systems_id", getNextDiagnosisRound);

export default router;
