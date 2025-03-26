import session from "express-session";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserInfoService,
} from "../services/authService.js";
import AppError from "../utils/appError.js";

const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ message: "회원가입 성공!", data: user });
  } catch (error) {
    next(new AppError("회원가입 실패: " + error.message, 500));
  }
};

const login = async (req, res, next) => {
  try {
    const user = await loginUser(req.body);

    req.session.user = user;
    console.log("로그인 후 세션 정보:", req.session); // 세션 상태 확인

    res.status(200).json({
      resultCode: "S-1",
      message: "로그인 성공",
      data: user,
    });
  } catch (error) {
    next(new AppError("로그인 실패: " + error.message, 500));
  }
};
const logout = async (req, res, next) => {
  try {
    await logoutUser(req); // 세션 삭제
    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res.status(200).json({ message: "로그아웃 성공" }); // 응답은 한 번만
  } catch (error) {
    next(new AppError("로그아웃 실패: " + error.message, 500));
  }
};

const getUserInfo = async (req, res, next) => {
  try {
    if (!req.session.user) {
      return next(new AppError("로그인이 필요합니다.", 401));
    }
    const userInfo = await getUserInfoService(req.session.user.id);
    res.status(200).json({ data: userInfo });
  } catch (error) {
    next(new AppError("사용자 정보 조회 실패: " + error.message, 500));
  }
};

export { register, login, logout, getUserInfo };
