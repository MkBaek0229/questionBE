import express from "express";
import {
  getAllUsers,
  getUserById,
  deleteUser,
  getAllExperts,
  getExpertById,
  deleteExpert,
  getAllSystems,
  getMatchedExperts,
  loginSuperUser,
  logoutSuperUser,
  getSystemById,
  matchExpertsToSystem,
  deleteSystemBySuperUser,
  SupergetQuantitativeQuestions,
  SupergetQualitativeQuestions,
  SupergetQuantitativeResponses,
  SupergetQualitativeResponses,
  addQuantitativeQuestion,
  editQuantitativeQuestion,
  deleteQuantitativeQuestion,
  addQualitativeQuestion,
  editQualitativeQuestion,
  deleteQualitativeQuestion,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/superuserController.js";
import csrfProtection from "../middlewares/csrf.js";
import { requireSuperUser } from "../middlewares/auth.js";

const router = express.Router();

router.get("/users", csrfProtection, requireSuperUser, getAllUsers);
router.get("/users/:id", csrfProtection, requireSuperUser, getUserById);
router.delete("/users/:id", csrfProtection, requireSuperUser, deleteUser);
router.get("/experts", csrfProtection, requireSuperUser, getAllExperts);
router.get("/experts/:id", csrfProtection, requireSuperUser, getExpertById);
router.delete("/experts/:id", csrfProtection, requireSuperUser, deleteExpert);
router.get("/systems", csrfProtection, requireSuperUser, getAllSystems);
router.get(
  "/systems/:systemId/experts",
  csrfProtection,
  requireSuperUser,
  getMatchedExperts
);
router.post("/login", csrfProtection, loginSuperUser);
router.post("/logout", csrfProtection, requireSuperUser, logoutSuperUser);
router.get("/systems/:id", csrfProtection, requireSuperUser, getSystemById);
router.post(
  "/systems/match-experts",
  csrfProtection,
  requireSuperUser,
  matchExpertsToSystem
);
router.delete(
  "/systems/:id",
  csrfProtection,
  requireSuperUser,
  deleteSystemBySuperUser
);
router.get(
  "/selftest/quantitative-questions",
  csrfProtection,
  requireSuperUser,
  SupergetQuantitativeQuestions
);
router.get(
  "/selftest/qualitative-questions",
  csrfProtection,
  requireSuperUser,
  SupergetQualitativeQuestions
);
router.get(
  "/selftest/quantitative-responses/:systemId",
  csrfProtection,
  requireSuperUser,
  SupergetQuantitativeResponses
);
router.get(
  "/selftest/qualitative-responses/:systemId",
  csrfProtection,
  requireSuperUser,
  SupergetQualitativeResponses
);
router.post(
  "/selftest/quantitative",
  csrfProtection,
  requireSuperUser,
  addQuantitativeQuestion
);
router.put(
  "/selftest/quantitative/:id",
  csrfProtection,
  requireSuperUser,
  editQuantitativeQuestion
);
router.delete(
  "/selftest/quantitative/:id",
  csrfProtection,
  requireSuperUser,
  deleteQuantitativeQuestion
);
router.post(
  "/selftest/qualitative",
  csrfProtection,
  requireSuperUser,
  addQualitativeQuestion
);
router.put(
  "/selftest/qualitative/:id",
  csrfProtection,
  requireSuperUser,
  editQualitativeQuestion
);
router.delete(
  "/selftest/qualitative/:id",
  csrfProtection,
  requireSuperUser,
  deleteQualitativeQuestion
);
router.get("/categories", csrfProtection, requireSuperUser, getCategories);
router.post("/categories", csrfProtection, requireSuperUser, addCategory);
router.put(
  "/categories/:categoryId",
  csrfProtection,
  requireSuperUser,
  updateCategory
);
router.delete(
  "/categories/:categoryId",
  csrfProtection,
  requireSuperUser,
  deleteCategory
);

export default router;
