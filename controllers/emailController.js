import {
  sendVerificationCodeService,
  verifyCodeService,
  findPasswordService,
  resetPasswordService,
} from "../services/emailService.js";
import AppError from "../utils/appError.js";

const sendVerificationCode = async (req, res, next) => {
  try {
    await sendVerificationCodeService(req.body);
    res.status(200).json({ message: "인증 코드가 전송되었습니다." });
  } catch (error) {
    next(new AppError("인증 코드 전송 실패: " + error.message, 500));
  }
};

const verifyCode = (req, res, next) => {
  try {
    verifyCodeService(req.body);
    res.status(200).json({ message: "이메일 인증이 완료되었습니다." });
  } catch (error) {
    next(new AppError("인증 코드 검증 실패: " + error.message, 500));
  }
};

const findPassword = async (req, res, next) => {
  try {
    await findPasswordService(req.body);
    res
      .status(200)
      .json({ message: "비밀번호 재설정 이메일이 전송되었습니다." });
  } catch (error) {
    next(
      new AppError("비밀번호 재설정 이메일 전송 실패: " + error.message, 500)
    );
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await resetPasswordService(req.body);
    res.status(200).json({ message: "비밀번호가 변경되었습니다." });
  } catch (error) {
    next(new AppError("비밀번호 변경 실패: " + error.message, 500));
  }
};

export { sendVerificationCode, verifyCode, findPassword, resetPassword };
