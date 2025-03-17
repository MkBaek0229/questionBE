import {
  registerExpertService,
  loginExpertService,
  logoutExpertService,
  getExpertInfoService,
  getAllExpertsService,
} from "../services/expertService.js";
import AppError from "../utils/appError.js";

const registerExpert = async (req, res, next) => {
  try {
    const expert = await registerExpertService(req.body);
    res
      .status(201)
      .json({ resultCode: "S-1", msg: "회원가입 성공", data: expert });
  } catch (error) {
    next(new AppError("회원가입 실패: " + error.message, 500));
  }
};

const loginExpert = async (req, res, next) => {
  try {
    const expert = await loginExpertService(req.body);
    req.session.expert = expert;
    res
      .status(200)
      .json({ resultCode: "S-1", msg: "로그인 성공", data: expert });
  } catch (error) {
    next(new AppError("로그인 실패: " + error.message, 500));
  }
};

const logoutExpert = (req, res, next) => {
  try {
    logoutExpertService(req, res);
    res.status(200).json({ resultCode: "S-1", msg: "로그아웃 성공" });
  } catch (error) {
    next(new AppError("로그아웃 실패: " + error.message, 500));
  }
};

const getExpertInfo = (req, res, next) => {
  try {
    const expertInfo = getExpertInfoService(req, res);
    res
      .status(200)
      .json({
        resultCode: "S-1",
        msg: "전문가 정보 조회 성공",
        data: expertInfo,
      });
  } catch (error) {
    next(new AppError("전문가 정보 조회 실패: " + error.message, 500));
  }
};

const getAllExperts = async (req, res, next) => {
  try {
    const experts = await getAllExpertsService();
    res.status(200).json({
      resultCode: "S-1",
      msg: "모든 관리자 데이터를 성공적으로 가져왔습니다.",
      data: experts,
    });
  } catch (error) {
    next(
      new AppError(
        "관리자 데이터 조회 중 오류가 발생했습니다: " + error.message,
        500
      )
    );
  }
};

export {
  registerExpert,
  loginExpert,
  logoutExpert,
  getExpertInfo,
  getAllExperts,
};
