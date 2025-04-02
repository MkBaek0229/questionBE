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
  getNextDiagnosisRoundService,
  getDiagnosisRoundsService,
} from "../services/selftestService.js";
import AppError from "../utils/appError.js";

const handleSelfAssessmentSave = async (req, res, next) => {
  try {
    const userId = req.session.user.id; // 세션에서 userId 가져오기
    const result = await handleSelfAssessmentSaveService(req.body, userId);
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("자가진단 저장 실패: " + error.message, 500));
  }
};

const submitQuantitativeResponses = async (req, res, next) => {
  try {
    const userId = req.session.user?.id;
    const result = await submitQuantitativeResponsesService(req.body, userId);
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

// 회차 목록 조회 컨트롤러
const getDiagnosisRounds = async (req, res, next) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return next(new AppError("로그인이 필요합니다", 401));
    }

    const { systemId } = req.params;
    const results = await getDiagnosisRoundsService({ systemId, userId });
    res.status(200).json(results);
  } catch (error) {
    next(new AppError("회차 목록 조회 실패: " + error.message, 500));
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
    const userId = req.session.user?.id;
    if (!userId) {
      return next(new AppError("로그인이 필요합니다", 401));
    }

    const { systemId } = req.params;
    const { round } = req.query; // URL 쿼리 파라미터로 회차 받기

    const diagnosisRound = round ? parseInt(round, 10) : null;
    const result = await getQuantitativeResponsesService({
      systemId,
      userId,
      round: diagnosisRound,
    });

    res.status(200).json(result);
  } catch (error) {
    next(new AppError("정량 응답 조회 실패: " + error.message, 500));
  }
};

const getQualitativeResponses = async (req, res, next) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return next(new AppError("로그인이 필요합니다", 401));
    }

    const { systemId } = req.params;
    const { round } = req.query;

    const diagnosisRound = round ? parseInt(round, 10) : null;
    const result = await getQualitativeResponsesService({
      systemId,
      userId,
      round: diagnosisRound,
    });

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

const getNextDiagnosisRound = async (req, res, next) => {
  try {
    const user = req.session.user;
    const { systems_id } = req.params;

    if (!user) {
      return next(new AppError("로그인이 필요합니다.", 401));
    }

    const round = await getNextDiagnosisRoundService(user.id, systems_id);
    res.status(200).json({ diagnosis_round: round });
  } catch (err) {
    next(new AppError("진단 회차 조회 실패: " + err.message, 500));
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
  getNextDiagnosisRound,
  getDiagnosisRounds,
};
