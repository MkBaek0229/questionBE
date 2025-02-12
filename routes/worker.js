import { getRedisClient } from "../db/redisClient.js";
import pool from "../db/connection.js"; // ✅ 기존 DB 연결 풀 가져오기
import bcrypt from "bcrypt";
import nodemailer from "nodemailer"; // ✅ nodemailer 모듈 가져오기

process.on("uncaughtException", (err) => {
  console.error("🚨 [Worker] 예상치 못한 오류 발생:", err);
  console.log("🔄 [Worker] 재시작하지 않고 계속 실행...");
});
process.on("exit", () => {
  console.log("🔄 [Worker] 종료 감지 - 자동 재시작");
  setTimeout(() => process.exit(1), 1000);
});

// ✅ 회원가입 Worker
async function processRegisterQueue() {
  while (true) {
    let connection;
    try {
      const redisCli = await getRedisClient(); // ✅ 안전한 Redis 연결 가져오기
      console.log("🔍 [DEBUG] Redis 클라이언트 상태 체크:", redisCli.isOpen);

      const data = await redisCli.brPop("register_queue", 0);
      if (!data) continue;

      let requestData;
      try {
        requestData = JSON.parse(data.element);
      } catch (parseError) {
        console.error("❌ [회원가입 Worker] JSON 파싱 오류:", parseError);
        continue;
      }

      const {
        email,
        password,
        institution_name,
        institution_address,
        representative_name,
        phone_number,
      } = requestData;
      console.log(`🚀 [회원가입 처리 시작] 이메일: ${email}`);

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [existingUser] = await connection.query(
        "SELECT * FROM User WHERE email = ?",
        [email]
      );
      if (existingUser.length > 0) {
        console.log(`⚠️ [회원가입 실패] 중복 이메일: ${email}`);
        await connection.rollback();
        connection.release();
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 8);
      await connection.query(
        `INSERT INTO User (institution_name, institution_address, representative_name, email, password, phone_number) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [
          institution_name,
          institution_address,
          representative_name,
          email,
          hashedPassword,
          phone_number,
        ]
      );

      await connection.commit();
      console.log(`✅ [회원가입 성공] 이메일: ${email}`);
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("❌ [회원가입 Worker 오류]:", error);
    } finally {
      if (connection) connection.release();
    }
  }
}

// ✅ 로그인 Worker
async function processLoginQueue() {
  while (true) {
    try {
      const redisCli = await getRedisClient(); // ✅ 안전한 Redis 연결 가져오기
      // Redis 큐에서 로그인 요청 가져오기 (가져올 때까지 대기)
      const data = await redisCli.brPop("login_queue", 0);
      if (!data) continue;

      const { email, password, requestId } = JSON.parse(data.element);
      console.log(`🔑 [로그인 처리 시작] 이메일: ${email}`);

      // ✅ MySQL에서 사용자 조회
      const [user] = await pool.query("SELECT * FROM User WHERE email = ?", [
        email,
      ]);
      if (!user || user.length === 0) {
        console.log(`⚠️ [로그인 실패] 이메일 없음: ${email}`);
        await redisCli.set(
          requestId,
          JSON.stringify({
            resultCode: "F-1",
            message: "이메일 또는 비밀번호가 잘못되었습니다.",
          }),
          "EX",
          5
        );
        continue;
      }

      // ✅ 비밀번호 검증
      const isMatch = await bcrypt.compare(password, user[0].password);
      if (!isMatch) {
        console.log(`❌ [로그인 실패] 비밀번호 불일치: ${email}`);
        await redisCli.set(
          requestId,
          JSON.stringify({
            resultCode: "F-1",
            message: "이메일 또는 비밀번호가 잘못되었습니다.",
          }),
          "EX",
          5
        );
        continue;
      }

      // ✅ 로그인 성공 → Redis에 결과 저장
      const userData = {
        id: user[0].id,
        email: user[0].email,
        name: user[0].representative_name,
        member_type: "user",
      };

      console.log(`✅ [로그인 성공] 이메일: ${email}`);
      await redisCli.set(
        requestId,
        JSON.stringify({
          resultCode: "S-1",
          message: "로그인 성공",
          data: userData,
        }),
        "EX",
        5
      );
    } catch (error) {
      console.error("❌ [로그인 Worker 오류]:", error);
    }
  }
}

// ✅ 전문가 회원가입 Worker
async function processRegisterExpertQueue() {
  while (true) {
    let connection;
    try {
      const redisCli = await getRedisClient(); // ✅ 안전한 Redis 연결 가져오기

      const data = await redisCli.brPop("register_expert_queue", 0);
      if (!data) continue;

      const {
        email,
        name,
        institution_name,
        ofcps,
        phone_number,
        major_carrea,
        password,
      } = JSON.parse(data.element);
      console.log(`🚀 [전문가 회원가입 처리 시작] 이메일: ${email}`);

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [existingUser] = await connection.query(
        "SELECT * FROM expert WHERE email = ?",
        [email]
      );
      if (existingUser.length > 0) {
        console.log(`⚠️ [회원가입 실패] 중복 이메일: ${email}`);
        await connection.rollback();
        connection.release();
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 8);
      await connection.query(
        `INSERT INTO expert (name, institution_name, ofcps, phone_number, email, major_carrea, password) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          institution_name,
          ofcps,
          phone_number,
          email,
          major_carrea,
          hashedPassword,
        ]
      );

      await connection.commit();
      console.log(`✅ [전문가 회원가입 성공] 이메일: ${email}`);
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("❌ [전문가 회원가입 Worker 오류]:", error);
    } finally {
      if (connection) connection.release();
    }
  }
}

// ✅ 전문가 로그인 Worker
async function processLoginExpertQueue() {
  while (true) {
    try {
      const redisCli = await getRedisClient(); // ✅ 안전한 Redis 연결 가져오기

      const data = await redisCli.brPop("login_expert_queue", 0);
      if (!data) continue;

      const { email, password, requestId } = JSON.parse(data.element);
      console.log(`🔑 [전문가 로그인 처리 시작] 이메일: ${email}`);

      const [user] = await pool.query("SELECT * FROM expert WHERE email = ?", [
        email,
      ]);
      if (
        !user ||
        user.length === 0 ||
        !(await bcrypt.compare(password, user[0].password))
      ) {
        await redisCli.set(
          requestId,
          JSON.stringify({
            resultCode: "F-1",
            message: "이메일 또는 비밀번호가 잘못되었습니다.",
          }),
          "EX",
          5
        );
        continue;
      }

      await redisCli.set(
        requestId,
        JSON.stringify({
          resultCode: "S-1",
          message: "로그인 성공",
          data: user[0],
        }),
        "EX",
        5
      );
      console.log(`✅ [전문가 로그인 성공] 이메일: ${email}`);
    } catch (error) {
      console.error("❌ [전문가 로그인 Worker 오류]:", error);
    }
  }
}

// ✅ 이메일 전송 설정
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ 인증 코드 생성
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

async function processEmailVerificationQueue() {
  console.log("🛠 [Worker 시작] 이메일 인증 요청을 처리합니다...");
  const redisCli = await getRedisClient();

  console.log("🔍 [DEBUG] Redis 클라이언트 상태 체크:", redisCli.isOpen);

  if (!redisCli.isOpen) {
    console.log("❌ Redis 연결이 닫혀 있습니다! 재연결 시도...");
    await redisCli.connect();
  }

  while (true) {
    try {
      console.log("🔍 [DEBUG] `brPop()` 실행 대기 중...");

      let data = await redisCli.brPop("email_verification_queue", 0);

      console.log("📩 [DEBUG] `brPop()` 실행 후 데이터:", data);
      if (!data || !data[1]) {
        console.log("⚠️ [Worker] 큐에서 가져온 데이터가 없음, 다시 대기...");
        continue;
      }

      const parsedData = JSON.parse(data[1]); // ✅ 올바르게 데이터 파싱
      console.log("✅ [DEBUG] `brPop()`에서 파싱된 데이터:", parsedData);

      const email = parsedData.email;
      await redisCli.setEx(`email_code:${email}`, 600, generateCode());
      console.log(`✅ [이메일 인증 코드 저장 완료] ${email}`);
    } catch (error) {
      console.error("❌ [Worker] 오류 발생:", error);
    }
  }
}

processRegisterQueue();
processLoginQueue();
processRegisterExpertQueue();
processLoginExpertQueue();
processEmailVerificationQueue();
