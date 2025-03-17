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
    res
      .status(200)
      .json({ resultCode: "S-1", message: "로그인 성공", data: user });
  } catch (error) {
    next(new AppError("로그인 실패: " + error.message, 500));
  }
};

const logout = (req, res, next) => {
  try {
    logoutUser(req, res);
    res.status(200).json({ message: "로그아웃 성공" });
  } catch (error) {
    next(new AppError("로그아웃 실패: " + error.message, 500));
  }
};

const getUserInfo = async (req, res, next) => {
  try {
    const userInfo = await getUserInfoService(req.user.id);
    res.status(200).json({ data: userInfo });
  } catch (error) {
    next(new AppError("사용자 정보 조회 실패: " + error.message, 500));
  }
};

export { register, login, logout, getUserInfo };
