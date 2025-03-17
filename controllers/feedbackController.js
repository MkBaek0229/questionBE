import {
  getAssignedSystemsService,
  submitQuantitativeFeedbackService,
  submitQualitativeFeedbackService,
  getFeedbacksService,
  updateFeedbackStatusService,
  getSystemAssessmentResultService,
  SystemsResultService,
  getSystemOwnerService,
} from "../services/feedbackService.js";
import AppError from "../utils/appError.js";

const getAssignedSystems = async (req, res, next) => {
  try {
    const results = await getAssignedSystemsService(req.query);
    res.status(200).json({
      resultCode: "S-1",
      msg: "매칭된 시스템 조회 성공",
      data: results,
    });
  } catch (error) {
    next(new AppError("매칭된 시스템 조회 실패: " + error.message, 500));
  }
};

const submitQuantitativeFeedback = async (req, res, next) => {
  try {
    await submitQuantitativeFeedbackService(req.body);
    res.status(200).json({ resultCode: "S-1", msg: "정량 피드백 저장 완료" });
  } catch (error) {
    next(new AppError("정량 피드백 저장 실패: " + error.message, 500));
  }
};

const submitQualitativeFeedback = async (req, res, next) => {
  try {
    await submitQualitativeFeedbackService(req.body);
    res.status(200).json({ resultCode: "S-1", msg: "정성 피드백 저장 완료" });
  } catch (error) {
    next(new AppError("정성 피드백 저장 실패: " + error.message, 500));
  }
};

const getFeedbacks = async (req, res, next) => {
  try {
    const results = await getFeedbacksService(req.query);
    res
      .status(200)
      .json({ resultCode: "S-1", msg: "피드백 조회 성공", data: results });
  } catch (error) {
    next(new AppError("피드백 조회 실패: " + error.message, 500));
  }
};

const updateFeedbackStatus = async (req, res, next) => {
  try {
    await updateFeedbackStatusService(req.body);
    res
      .status(200)
      .json({ resultCode: "S-1", msg: "피드백 상태 업데이트 성공" });
  } catch (error) {
    next(new AppError("피드백 상태 업데이트 실패: " + error.message, 500));
  }
};

const getSystemAssessmentResult = async (req, res, next) => {
  try {
    const results = await getSystemAssessmentResultService(req.query);
    res.status(200).json({
      resultCode: "S-1",
      msg: "자가진단 결과 조회 성공",
      data: results,
    });
  } catch (error) {
    next(new AppError("자가진단 결과 조회 실패: " + error.message, 500));
  }
};

const SystemsResult = async (req, res, next) => {
  try {
    const results = await SystemsResultService(req.query);
    res
      .status(200)
      .json({ resultCode: "S-1", msg: "시스템 결과 조회 성공", data: results });
  } catch (error) {
    next(new AppError("시스템 결과 조회 실패: " + error.message, 500));
  }
};

const getSystemOwner = async (req, res, next) => {
  try {
    const result = await getSystemOwnerService(req.query);
    res.status(200).json({
      resultCode: "S-1",
      msg: "기관회원 조회 성공",
      userId: result.user_id,
    });
  } catch (error) {
    next(new AppError("기관회원 조회 실패: " + error.message, 500));
  }
};

export {
  getAssignedSystems,
  submitQuantitativeFeedback,
  submitQualitativeFeedback,
  getFeedbacks,
  updateFeedbackStatus,
  getSystemAssessmentResult,
  SystemsResult,
  getSystemOwner,
};
