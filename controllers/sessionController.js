import { checkSessionService } from "../services/sessionService.js";
import AppError from "../utils/appError.js";

// 통합 세션 체크 컨트롤러
export const checkSession = async (req, res, next) => {
  try {
    const sessionData = await checkSessionService(req);
    res.status(200).json(sessionData);
  } catch (error) {
    next(new AppError("세션 확인 실패: " + error.message, 500));
  }
};
