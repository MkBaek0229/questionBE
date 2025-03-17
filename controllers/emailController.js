import {
  sendVerificationCodeService,
  verifyCodeService,
  findPasswordService,
  resetPasswordService,
} from "../services/emailService.js";

const sendVerificationCode = async (req, res) => {
  try {
    await sendVerificationCodeService(req.body);
    res.status(200).json({ message: "인증 코드가 전송되었습니다." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "인증 코드 전송 실패", error: error.message });
  }
};

const verifyCode = (req, res) => {
  try {
    verifyCodeService(req.body);
    res.status(200).json({ message: "이메일 인증이 완료되었습니다." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "인증 코드 검증 실패", error: error.message });
  }
};

const findPassword = async (req, res) => {
  try {
    await findPasswordService(req.body);
    res
      .status(200)
      .json({ message: "비밀번호 재설정 이메일이 전송되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    await resetPasswordService(req.body);
    res.status(200).json({ message: "비밀번호가 변경되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

export { sendVerificationCode, verifyCode, findPassword, resetPassword };
