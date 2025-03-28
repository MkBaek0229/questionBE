import { getUploadMiddlewareService } from "../services/uploadService.js";
import AppError from "../utils/appError.js";

const uploadImageMiddleware = getUploadMiddlewareService("image");
const uploadDocumentMiddleware = getUploadMiddlewareService("document");

const uploadImage = (req, res, next) => {
  uploadImageMiddleware(req, res, (err) => {
    if (err) {
      return next(new AppError("이미지 업로드 실패: " + err.message, 500));
    }
    res.status(200).json({ message: "이미지 업로드 성공", file: req.file });
  });
};

const uploadDocument = (req, res, next) => {
  uploadDocumentMiddleware(req, res, (err) => {
    if (err) {
      return next(new AppError("문서 업로드 실패: " + err.message, 500));
    }
    res.status(200).json({ message: "문서 업로드 성공", file: req.file });
  });
};

export { uploadImage, uploadDocument };
