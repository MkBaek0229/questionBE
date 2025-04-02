import {
  completeSelfTestService,
  getAssessmentResultsService,
  getAssessmentStatusesService,
  getCategoryComparisonService,
  getDiagnosisRoundsService,
  getResultByRoundService,
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
    const userId = req.session.user?.id; // ✅ 세션에서 추출
    const systemId = req.query.systemId;

    const results = await getAssessmentResultsService({ userId, systemId });
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

const getDiagnosisRounds = async (req, res, next) => {
  try {
    const userId = req.session.user?.id;
    const { systemId } = req.query;

    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    const result = await getDiagnosisRoundsService({ userId, systemId });
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("회차 목록 조회 실패: " + error.message, 500));
  }
};

const getResultByRound = async (req, res, next) => {
  try {
    const userId = req.session.user?.id; // ✅ 세션에서 userId 가져오기
    const { systemId, diagnosisRound } = req.query;

    const result = await getResultByRoundService({
      userId,
      systemId,
      diagnosisRound,
    });
    res.status(200).json(result);
  } catch (error) {
    next(new AppError("특정 회차 결과 조회 실패: " + error.message, 500));
  }
};

const getCategoryComparison = async (req, res, next) => {
  try {
    const { systemId } = req.params;
    const userId = req.session.user?.id;

    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    const results = await getCategoryComparisonService(systemId, userId);

    // 자가진단 여부 확인 (결과가 빈 배열이거나 hasDiagnosis 속성이 false인 경우)
    if (!results || results.hasDiagnosis === false) {
      return res.status(404).json({
        status: "error",
        message: "자가진단이 필요합니다.",
      });
    }

    res.status(200).json(results.data || results);
  } catch (error) {
    next(
      new AppError("카테고리별 비교 데이터 조회 실패: " + error.message, 500)
    );
  }
};

export {
  completeSelfTest,
  getAssessmentResults,
  getAssessmentStatuses,
  getDiagnosisRounds,
  getResultByRound,
  getCategoryComparison,
};
