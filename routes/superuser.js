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

const router = express.Router();

router.get("/users", csrfProtection, getAllUsers);
router.get("/users/:id", csrfProtection, getUserById);
router.delete("/users/:id", csrfProtection, deleteUser);
router.get("/experts", csrfProtection, getAllExperts);
router.get("/experts/:id", csrfProtection, getExpertById);
router.delete("/experts/:id", csrfProtection, deleteExpert);
router.get("/systems", csrfProtection, getAllSystems);
router.get("/systems/:systemId/experts", csrfProtection, getMatchedExperts);
router.post("/login", csrfProtection, loginSuperUser);
router.post("/logout", csrfProtection, logoutSuperUser);
router.get("/systems/:id", csrfProtection, getSystemById);
router.post("/systems/match-experts", csrfProtection, matchExpertsToSystem);
router.delete("/systems/:id", csrfProtection, deleteSystemBySuperUser);
router.get(
  "/selftest/quantitative-questions",
  csrfProtection,
  SupergetQuantitativeQuestions
);
router.get(
  "/selftest/qualitative-questions",
  csrfProtection,
  SupergetQualitativeQuestions
);
router.get(
  "/selftest/quantitative-responses/:systemId",
  csrfProtection,
  SupergetQuantitativeResponses
);
router.get(
  "/selftest/qualitative-responses/:systemId",
  csrfProtection,
  SupergetQualitativeResponses
);
router.post("/selftest/quantitative", csrfProtection, addQuantitativeQuestion);
router.put(
  "/selftest/quantitative/:id",
  csrfProtection,
  editQuantitativeQuestion
);
router.delete(
  "/selftest/quantitative/:id",
  csrfProtection,
  deleteQuantitativeQuestion
);
router.post("/selftest/qualitative", csrfProtection, addQualitativeQuestion);
router.put(
  "/selftest/qualitative/:id",
  csrfProtection,
  editQualitativeQuestion
);
router.delete(
  "/selftest/qualitative/:id",
  csrfProtection,
  deleteQualitativeQuestion
);
router.get("/categories", csrfProtection, getCategories);
router.post("/categories", csrfProtection, addCategory);
router.put("/categories/:categoryId", csrfProtection, updateCategory);
router.delete("/categories/:categoryId", csrfProtection, deleteCategory);

export default router;
