import {
  handleSelfAssessmentSaveService,
  submitQuantitativeResponsesService,
  submitQualitativeResponsesService,
  getQuantitativeQuestionsService,
  getQualitativeQuestionsService,
  getQuantitativeResponsesService,
  getQualitativeResponsesService,
  updateQuantitativeQuestionService,
  updateQualitativeQuestionService,
} from "../services/selftestService.js";
import AppError from "../utils/appError.js";

const handleSelfAssessmentSave = async (req, res, next) => {
  try {
    const result = await handleSelfAssessmentSaveService(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("자가진단 저장 실패: " + error.message, 500));
  }
};

const submitQuantitativeResponses = async (req, res, next) => {
  try {
    const result = await submitQuantitativeResponsesService(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("정량 응답 제출 실패: " + error.message, 500));
  }
};

const submitQualitativeResponses = async (req, res, next) => {
  try {
    const result = await submitQualitativeResponsesService(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("정성 응답 제출 실패: " + error.message, 500));
  }
};

const getQuantitativeQuestions = async (req, res, next) => {
  try {
    const result = await getQuantitativeQuestionsService();
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("정량 질문 조회 실패: " + error.message, 500));
  }
};

const getQualitativeQuestions = async (req, res, next) => {
  try {
    const result = await getQualitativeQuestionsService();
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("정성 질문 조회 실패: " + error.message, 500));
  }
};

const getQuantitativeResponses = async (req, res, next) => {
  try {
    const result = await getQuantitativeResponsesService(
      req.params.systemId,
      req.params.userId
    );
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("정량 응답 조회 실패: " + error.message, 500));
  }
};

const getQualitativeResponses = async (req, res, next) => {
  try {
    const result = await getQualitativeResponsesService(
      req.params.systemId,
      req.params.userId
    );
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("정성 응답 조회 실패: " + error.message, 500));
  }
};

const updateQuantitativeQuestion = async (req, res, next) => {
  try {
    const result = await updateQuantitativeQuestionService(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("정량 질문 업데이트 실패: " + error.message, 500));
  }
};

const updateQualitativeQuestion = async (req, res, next) => {
  try {
    const result = await updateQualitativeQuestionService(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("정성 질문 업데이트 실패: " + error.message, 500));
  }
};

export {
  handleSelfAssessmentSave,
  submitQuantitativeResponses,
  submitQualitativeResponses,
  getQuantitativeQuestions,
  getQualitativeQuestions,
  getQuantitativeResponses,
  getQualitativeResponses,
  updateQuantitativeQuestion,
  updateQualitativeQuestion,
};
