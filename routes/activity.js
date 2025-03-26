import express from "express";
import { getRecentActivities } from "../controllers/activityController.js";

const router = express.Router();

router.get("/recent", getRecentActivities);

export default router;
