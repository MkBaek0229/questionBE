import express from "express";
import bcrypt from "bcrypt";
import pool from "../../db/connection.js"; // .js 확장자를 명시적으로 추가

const router = express.Router();

// 전문가 회원가입
const registerExpert = async (req, res) => {
  const {
    email,
    name,
    institution_name,
    ofcps,
    phone_number,
    major_carrea,
    password,
  } = req.body;

  if (
    !email ||
    !name ||
    !institution_name ||
    !ofcps ||
    !phone_number ||
    !password
  ) {
    return res
      .status(400)
      .json({ resultCode: "F-1", msg: "필수 입력 값이 누락되었습니다." });
  }

  try {
    // 비밀번호 해싱 및 전문가 등록
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `
      INSERT INTO expert (name, institution_name, ofcps, phone_number, email, major_carrea, password) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
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

    const [rows] = await pool.query(
      "SELECT id, name, email FROM expert WHERE id = LAST_INSERT_ID()"
    );

    res
      .status(201)
      .json({ resultCode: "S-1", msg: "회원가입 성공", data: rows[0] });
  } catch (error) {
    console.error("Error registering expert:", error);
    res
      .status(500)
      .json({ resultCode: "F-1", msg: "서버 에러 발생", error: error.message });
  }
};

const loginExpert = async (req, res) => {
  const { email, password } = req.body;

  console.log("Login Request:", req.body); // 요청 데이터 출력

  if (!email || !password) {
    return res
      .status(400)
      .json({ resultCode: "F-1", msg: "이메일과 비밀번호를 입력해주세요." });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM expert WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({
        resultCode: "F-2",
        msg: "이메일 또는 비밀번호가 잘못되었습니다.",
      });
    }

    const expert = rows[0];
    const isMatch = await bcrypt.compare(password, expert.password);

    if (!isMatch) {
      return res.status(400).json({
        resultCode: "F-2",
        msg: "이메일 또는 비밀번호가 잘못되었습니다.",
      });
    }

    req.session.expert = {
      id: expert.id,
      email: expert.email,
      name: expert.name,
    };

    console.log("Session Data:", req.session.expert); // 세션 데이터 확인

    res.status(200).json({
      resultCode: "S-1",
      msg: "로그인 성공",
      data: req.session.expert,
    });
  } catch (error) {
    console.error("Error logging in expert:", error);
    res
      .status(500)
      .json({ resultCode: "F-1", msg: "서버 에러 발생", error: error.message });
  }
};

const logoutExpert = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ resultCode: "F-1", msg: "로그아웃 실패" });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ resultCode: "S-1", msg: "로그아웃 성공" });
  });
};

export { registerExpert, loginExpert, logoutExpert };
export default router;
