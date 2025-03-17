import express from "express";
import {
  getAssignedSystems,
  submitQuantitativeFeedback,
  submitQualitativeFeedback,
  getFeedbacks,
  updateFeedbackStatus,
  getSystemAssessmentResult,
  SystemsResult,
  getSystemOwner,
} from "../controllers/feedbackController.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

router.get("/assigned-systems", csrfProtection, getAssignedSystems);
router.post(
  "/quantitative-feedback",
  csrfProtection,
  submitQuantitativeFeedback
);
router.post("/qualitative-feedback", csrfProtection, submitQualitativeFeedback);
router.get("/feedbacks", csrfProtection, getFeedbacks);
router.post("/update-feedback-status", csrfProtection, updateFeedbackStatus);
router.get(
  "/system-assessment-result",
  csrfProtection,
  getSystemAssessmentResult
);
router.get("/systems-result", csrfProtection, SystemsResult);
router.get("/system-owner", csrfProtection, getSystemOwner);

export default router;
