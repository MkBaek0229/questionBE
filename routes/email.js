import nodemailer from "nodemailer";

let verificationCodes = {}; // 간단한 메모리 저장소 (임시 사용)

// 이메일 전송 코드
const sendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ resultCode: "F-1", msg: "이메일을 입력해주세요." });
  }

  try {
    // 6자리 인증코드 생성
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // 인증 코드 메모리 저장소에 저장
    verificationCodes[email] = verificationCode;

    // 네이버 SMTP 설정
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // 네이버 SMTP 서버
      port: process.env.SMTP_PORT, // TLS 포트
      secure: process.env.SMTP_SECURE === "true", // TLS를 사용할 경우 true
      auth: {
        user: process.env.EMAIL_USER, // 네이버 이메일 주소
        pass: process.env.EMAIL_PASS, // 앱 비밀번호
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, // 발신자 이메일 주소
      to: email, // 사용자가 입력한 이메일 -> 목적지 주소 이메일
      subject: "인증 관련 메일입니다.",
      html: `<h1>인증번호를 입력해주세요</h1><p>${verificationCode}</p>`,
    };

    // 이메일 전송
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      resultCode: "S-1",
      msg: "인증코드가 전송되었습니다.",
      authNum: verificationCode,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      resultCode: "F-1",
      msg: "이메일 전송 실패",
      error: error.message,
    });
  }
};

// 인증 코드 확인
const verifyEmailCode = (req, res) => {
  const { email, clientCode } = req.body;

  if (!email || !clientCode) {
    return res.status(400).json({
      resultCode: "F-1",
      msg: "이메일, 인증코드, 입력값을 확인해주세요.",
    });
  }

  try {
    // 인증 코드 확인 (임시 구현: verificationCode와 clientCode 비교)
    const storedCode = verificationCodes[email];

    if (!storedCode) {
      return res
        .status(400)
        .json({ resultCode: "F-2", msg: "인증코드가 존재하지 않습니다." });
    }

    if (clientCode === storedCode) {
      // 인증 성공 시 메모리에서 삭제
      delete verificationCodes[email];

      return res
        .status(200)
        .json({ resultCode: "S-1", msg: "이메일 인증 성공" });
    } else {
      return res
        .status(400)
        .json({ resultCode: "F-3", msg: "인증 코드가 일치하지 않습니다." });
    }
  } catch (error) {
    console.error("Error verifying code:", error);
    res
      .status(500)
      .json({ resultCode: "F-1", msg: "서버 에러 발생", error: error.message });
  }
};

export { sendVerificationEmail, verifyEmailCode };
