import express from "express";
import {
  uploadImage,
  uploadDocument,
} from "../controllers/uploadController.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

router.post("/image", csrfProtection, uploadImage);

router.post("/document", csrfProtection, uploadDocument);

export default router;
