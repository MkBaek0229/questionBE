import {
  completeSelfTestService,
  getAssessmentResultsService,
  getAssessmentStatusesService,
  getCategoryProtectionScoresService,
} from "../services/resultService.js";
import AppError from "../utils/appError.js";

const completeSelfTest = async (req, res, next) => {
  try {
    const result = await completeSelfTestService(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("자가진단 완료 실패: " + error.message, 500));
  }
};

const getAssessmentResults = async (req, res, next) => {
  try {
    const results = await getAssessmentResultsService(req.query);
    res.status(200).json(results);
  } catch (error) {
    next(new AppError("진단 결과 조회 실패: " + error.message, 500));
  }
};

const getAssessmentStatuses = async (req, res, next) => {
  try {
    const statusMap = await getAssessmentStatusesService();
    res.status(200).json(statusMap);
  } catch (error) {
    next(new AppError("진단 상태 조회 실패: " + error.message, 500));
  }
};

const getCategoryProtectionScores = async (req, res, next) => {
  try {
    const categoryScores = await getCategoryProtectionScoresService(req.params);
    res.status(200).json(categoryScores);
  } catch (error) {
    next(new AppError("카테고리 보호 점수 조회 실패: " + error.message, 500));
  }
};

export {
  completeSelfTest,
  getAssessmentResults,
  getAssessmentStatuses,
  getCategoryProtectionScores,
};
