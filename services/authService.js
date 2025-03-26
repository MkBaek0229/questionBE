import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const registerUser = async ({
  institution_name,
  institution_address,
  representative_name,
  email,
  password,
  phone_number,
}) => {
  const [existingUser] = await pool.query(
    "SELECT * FROM User WHERE email = ?",
    [email]
  );
  if (existingUser.length > 0) {
    throw new Error("이미 사용 중인 이메일입니다.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
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

  return { id: result.insertId, email, name: representative_name };
};

const loginUser = async ({ email, password }) => {
  const [user] = await pool.query("SELECT * FROM User WHERE email = ?", [
    email,
  ]);
  if (!user || user.length === 0) {
    throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
  }

  const isMatch = await bcrypt.compare(password, user[0].password);
  if (!isMatch) {
    throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
  }

  return {
    id: user[0].id,
    email: user[0].email,
    name: user[0].representative_name,
  };
};
const logoutUser = async (req) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        return reject(new Error("세션 삭제 실패"));
      }
      resolve("세션 삭제 성공");
    });
  });
};

const getUserInfoService = async (userId) => {
  // userId로 DB 조회 (예: MySQL)
  const [rows] = await pool.query(
    "SELECT id, email, representative_name AS name FROM User WHERE id = ?",
    [userId]
  );
  if (!rows || rows.length === 0) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }
  return rows[0];
};

export { registerUser, loginUser, logoutUser, getUserInfoService };
