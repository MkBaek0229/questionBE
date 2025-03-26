import express from "express";
import {
  uploadImage,
  uploadDocument,
} from "../controllers/uploadController.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

router.post("/upload/image", csrfProtection, uploadImage);

router.post("/upload/document", csrfProtection, uploadDocument);

export default router;
