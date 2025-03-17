import express from "express";
import {
  uploadImage,
  uploadDocument,
} from "../controllers/uploadController.js";
import csrfProtection from "../middlewares/csrf.js";

const router = express.Router();

router.post(
  "/upload/image",
  csrfProtection,
  uploadImage.single("file"),
  (req, res) => {
    res.status(200).json({ message: "이미지 업로드 성공", file: req.file });
  }
);

router.post(
  "/upload/document",
  csrfProtection,
  uploadDocument.single("file"),
  (req, res) => {
    res.status(200).json({ message: "문서 업로드 성공", file: req.file });
  }
);

export default router;
