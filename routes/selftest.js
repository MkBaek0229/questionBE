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
} from "../controllers/selftestController.js";
import csrfProtection from "../middlewares/csrf.js";
import { requireSuperUser } from "../middlewares/auth.js";

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
router.get("/quantitative-questions", csrfProtection, getQuantitativeQuestions);
router.get("/qualitative-questions", csrfProtection, getQualitativeQuestions);
router.get(
  "/quantitative-responses/:systemId/:userId",
  csrfProtection,
  getQuantitativeResponses
);
router.get(
  "/qualitative-responses/:systemId/:userId",
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
