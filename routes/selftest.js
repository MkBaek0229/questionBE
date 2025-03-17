import express from "express";
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
} from "../controllers/selftestController.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

router.post("/self-assessment", csrfProtection, handleSelfAssessmentSave);
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
  updateQuantitativeQuestion
);
router.put("/qualitative-question", csrfProtection, updateQualitativeQuestion);

export default router;
