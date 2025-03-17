import nodemailer from "nodemailer";
import dotenv from "dotenv";
import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

dotenv.config();

// 이메일 전송 설정
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 인증 코드 생성
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 숫자
};

// 임시 저장소 (실제 사용 시 Redis 권장)
const tempStorage = {};

// 이메일 형식 검증 함수
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const sendVerificationCodeService = async ({ email, member_type }) => {
  if (!email) {
    throw new Error("이메일 주소가 필요합니다.");
  }

  if (!validateEmail(email)) {
    throw new Error("유효한 이메일 주소를 입력해주세요.");
  }

  // 이메일 중복 확인
  if (member_type === "user") {
    const [existingUser] = await pool.query(
      "SELECT * FROM User WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      throw new Error("이미 사용 중인 이메일입니다.");
    }
  } else if (member_type === "expert") {
    const [existingUser] = await pool.query(
      "SELECT * FROM expert WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      throw new Error("이미 사용 중인 이메일입니다.");
    }
  }

  // 요청 제한: 1분 내 3회 이상 요청 방지
  if (!tempStorage[email]) {
    tempStorage[email] = { requestCount: 0, lastRequestTime: Date.now() };
  }
  const elapsedTime = Date.now() - tempStorage[email].lastRequestTime;
  if (elapsedTime < 60 * 1000) {
    // 1분 이내 요청
    if (tempStorage[email].requestCount >= 3) {
      throw new Error("너무 많은 요청입니다. 1분 후 다시 시도하세요.");
    }
    tempStorage[email].requestCount++;
  } else {
    // 1분이 지나면 요청 횟수 초기화
    tempStorage[email].requestCount = 1;
    tempStorage[email].lastRequestTime = Date.now();
  }

  const code = generateCode();
  const expiration = Date.now() + 10 * 60 * 1000; // 10분 유효

  // 임시 저장소에 저장
  tempStorage[email] = { code, expiration };

  // 이메일 내용
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "이메일 인증 코드",
    html: `<p>인증 코드: <b>${code}</b></p><p>10분 안에 입력해주세요.</p>`,
  };

  // 이메일 전송
  await transporter.sendMail(mailOptions);
};

const verifyCodeService = ({ email, code }) => {
  if (!email || !code) {
    throw new Error("이메일과 인증 코드가 필요합니다.");
  }

  const storedCode = tempStorage[email];
  if (!storedCode) {
    throw new Error("인증 코드가 요청되지 않았습니다.");
  }

  // 인증 코드 실패 횟수 확인
  if (!tempStorage[email].attempts) {
    tempStorage[email].attempts = 0;
  }

  if (tempStorage[email].attempts >= 5) {
    throw new Error("너무 많은 시도! 10분 후 다시 시도하세요.");
  }

  // 인증 코드 만료 확인
  if (storedCode.expiration < Date.now()) {
    delete tempStorage[email];
    throw new Error("유효하지 않거나 만료된 인증 코드입니다.");
  }
  // 인증 코드 검증
  if (tempStorage[email].code !== code) {
    tempStorage[email].attempts += 1;
    throw new Error("인증 코드가 일치하지 않습니다.");
  }

  // 인증 성공 후 데이터 삭제
  delete tempStorage[email]; // 인증 완료 후 삭제
};

const findPasswordService = async ({ email }) => {
  if (!email) throw new Error("이메일이 필요합니다.");

  // 이메일이 존재하는지 확인
  const [users] = await pool.query("SELECT id FROM User WHERE email = ?", [
    email,
  ]);

  if (users.length === 0) {
    throw new Error("가입된 이메일이 없습니다.");
  }

  const userId = users[0].id;

  // 기존 토큰 삭제
  await pool.query("DELETE FROM PasswordResetTokens WHERE user_id = ?", [
    userId,
  ]);

  // 랜덤 토큰 생성
  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

  // DB에 저장
  await pool.query(
    "INSERT INTO PasswordResetTokens (user_id, token, expires_at) VALUES (?, ?, ?)",
    [userId, resetToken, expiresAt]
  );

  // 비밀번호 재설정 이메일 전송
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "비밀번호 재설정 요청",
    html: `<p>비밀번호를 재설정하려면 아래 링크를 클릭하세요:</p>
           <p><a href="${resetLink}">${resetLink}</a></p>
           <p>이 링크는 10분 동안 유효합니다.</p>`,
  });
};

const resetPasswordService = async ({ token, password }) => {
  if (!token || !password) {
    throw new Error("토큰과 새 비밀번호가 필요합니다.");
  }

  // 토큰 검증 (만료시간 체크)
  const [tokenData] = await pool.query(
    "SELECT user_id FROM PasswordResetTokens WHERE token = ? AND expires_at > NOW()",
    [token]
  );

  if (tokenData.length === 0) {
    throw new Error("유효하지 않거나 만료된 토큰입니다.");
  }

  const userId = tokenData[0].user_id;

  // 기존 비밀번호 가져오기
  const [user] = await pool.query("SELECT password FROM User WHERE id = ?", [
    userId,
  ]);

  if (user.length === 0) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const existingPassword = user[0].password;

  // 기존 비밀번호와 새 비밀번호 비교
  const isSamePassword = await bcrypt.compare(password, existingPassword);
  if (isSamePassword) {
    throw new Error(
      "새 비밀번호가 기존 비밀번호와 동일합니다. 다른 비밀번호를 입력해주세요."
    );
  }

  // 비밀번호 해싱 후 저장
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query("UPDATE User SET password = ? WHERE id = ?", [
    hashedPassword,
    userId,
  ]);

  // 토큰 사용 후 삭제 (한 번만 사용 가능)
  await pool.query("DELETE FROM PasswordResetTokens WHERE user_id = ?", [
    userId,
  ]);
};

export {
  sendVerificationCodeService,
  verifyCodeService,
  findPasswordService,
  resetPasswordService,
};
