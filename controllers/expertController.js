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

    if (!req.session.remeberMe) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7일
    } else {
      // 미체크: 브라우저 종료 시 쿠키 만료 (세션 쿠키)
      req.session.cookie.expires = false;
    }

    res
      .status(200)
      .json({ resultCode: "S-1", msg: "로그인 성공", data: expert });
  } catch (error) {
    next(new AppError("로그인 실패: " + error.message, 500));
  }
};

const logoutExpert = async (req, res, next) => {
  try {
    await logoutExpertService(req);

    // 쿠키 삭제는 컨트롤러에서만 처리
    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // 응답은 한 번만
    res.status(200).json({ message: "로그아웃 성공" });
  } catch (error) {
    next(new AppError("로그아웃 실패: " + error.message, 500));
  }
};

const getExpertInfo = async (req, res, next) => {
  try {
    if (!req.session.expert) {
      return next(new AppError("전문가 로그인이 필요합니다.", 401));
    }

    const expertInfo = await getExpertInfoService(req.session.expert.id);
    res.status(200).json({
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
