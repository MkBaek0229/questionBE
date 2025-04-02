import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const registerExpertService = async ({
  email,
  name,
  institution_name,
  ofcps,
  phone_number,
  major_carrea,
  password,
}) => {
  const [existingUser] = await pool.query(
    "SELECT * FROM expert WHERE email = ?",
    [email]
  );
  if (existingUser.length > 0) {
    throw new Error("이미 가입된 이메일입니다.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
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

  const [newUser] = await pool.query(
    "SELECT id, name, email FROM expert WHERE email = ?",
    [email]
  );
  return newUser[0];
};

const loginExpertService = async ({ email, password }) => {
  const [rows] = await pool.query("SELECT * FROM expert WHERE email = ?", [
    email,
  ]);
  if (!rows || rows.length === 0) {
    throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
  }

  const expert = rows[0];
  const isMatch = await bcrypt.compare(password, expert.password);
  if (!isMatch) {
    throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
  }

  return {
    id: expert.id,
    email: expert.email,
    name: expert.name,
    member_type: "expert",
  };
};

const logoutExpertService = (req) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        return reject(new Error("세션 삭제 실패"));
      }
      resolve("세션 삭제 성공");
    });
  });
};

const getExpertInfoService = async (expertId) => {
  // expertId로 전문가 정보 조회
  const [rows] = await pool.query(
    "SELECT id, email, name, institution_name, ofcps, phone_number, major_carrea FROM expert WHERE id = ?",
    [expertId]
  );

  if (!rows || rows.length === 0) {
    throw new Error("전문가를 찾을 수 없습니다.");
  }

  return rows[0];
};

const getAllExpertsService = async () => {
  const [experts] = await pool.query(
    `SELECT 
        id AS expert_id,
        name AS expert_name,
        institution_name,
        ofcps AS position,
        phone_number,
        email,
        major_carrea AS major_experience
     FROM expert
     ORDER BY id ASC`
  );
  return experts;
};

export {
  registerExpertService,
  loginExpertService,
  logoutExpertService,
  getExpertInfoService,
  getAllExpertsService,
};
