import nodemailer from "nodemailer";
import dotenv from "dotenv";
import pool from "../db/connection.js"; // DB 연결 파일
import redisClint from "../db/redisClient.js"; // Redis 연결 파일

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

// 이메일 형식 검증 함수
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// 인증 코드 전송
const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "이메일 주소가 필요합니다." });
  }

  if (!validateEmail(email)) {
    return res
      .status(400)
      .json({ message: "유효한 이메일 주소를 입력해주세요." });
  }

  try {
    // 이메일 중복 확인
    const [existingUser] = await pool.query(
      "SELECT * FROM User WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });
    }

    const requestKey = `request_count:${email}`;
    const requestCount = await redisClint.incr(requestKey); // 요청 횟수 증가

    if (requestCount === 1) {
      await redisClint.expire(requestKey, 60); // 최초 요청 시 1분 TTL 설정
    } else if (requestCount > 3) {
      return res
        .status(429)
        .json({ message: "너무 많은 요청입니다. 1분 후 다시 시도하세요." });
    }

    const code = generateCode();
    const expiration = 10 * 60; // 10분 유효

    const redisKey = `verification_code:${email}`;

    await redisClint.set(redisKey, JSON.stringify({ code }, "EX", expiration));
    // 이메일 내용
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "이메일 인증 코드",
      html: `<p>인증 코드: <b>${code}</b></p><p>10분 안에 입력해주세요.</p>`,
    };

    // 이메일 전송
    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "인증 코드가 전송되었습니다.", data: code });
  } catch (error) {
    console.error("인증 코드 전송 실패:", error.message);
    res
      .status(500)
      .json({ message: "인증 코드 전송 실패", error: error.message });
  }
};

// 인증 코드 검증
const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ message: "이메일과 인증 코드가 필요합니다." });
  }

  try {
    const redisKey = `verification_code:${email}`;
    const attemptsKey = `attempts:${email}`;

    // Redis에서 인증 코드 가져오기
    const storedData = await redisClint.get(redisKey);

    if (!storedData) {
      return res
        .status(400)
        .json({ message: "인증 코드가 존재하지 않거나 만료되었습니다." });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(storedData);
    } catch (error) {
      console.error("Redis 데이터 파싱 오류:", error.message);
      return res
        .status(500)
        .json({ message: "서버 오류: 인증 코드 데이터 오류" });
    }

    const { code: storedCode, expiration } = parsedData;
    // // 인증 코드 실패 횟수 확인
    const attempts = await redisClint.get(attemptsKey);
    if (attempts && Number(attempts) >= 5) {
      return res
        .status(429)
        .json({ message: "너무 많은 시도! 10분 후 다시 시도하세요." });
    }

    // 인증 코드 만료 확인
    if (Date.now() > expiration) {
      await redisClint.del(email);
      return res
        .status(400)
        .json({ message: "유효하지 않거나 만료된 인증 코드입니다." });
    }

    // 인증 코드 검증
    if (storedCode !== code) {
      await redisClint.incr(attemptsKey); // 실패 횟수 증가
      await redisClint.expire(attemptsKey, 600); // 10분 후 자동 삭제
      return res
        .status(400)
        .json({ message: "인증 코드가 일치하지 않습니다." });
    }

    // 인증 성공 후 데이터 삭제
    await redisClint.del(redisKey); // Redis에서 삭제
    await redisClint.del(attemptsKey);

    res.status(200).json({ message: "이메일 인증이 완료되었습니다." });
  } catch (error) {
    console.error("인증 코드 검증 실패:", error.message);
    res
      .status(500)
      .json({ message: "인증 코드 검증 실패", error: error.message });
  }
};

export { verifyCode, sendVerificationCode };
