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

const logoutExpertService = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ resultCode: "F-1", msg: "로그아웃 실패" });
    }

    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    res.status(200).json({ resultCode: "S-1", msg: "로그아웃 성공" });
  });
};

const getExpertInfoService = (req, res) => {
  if (!req.session || !req.session.expert) {
    return res
      .status(401)
      .json({ resultCode: "F-1", msg: "로그인이 필요합니다." });
  }
  res.status(200).json({ resultCode: "S-1", expert: req.session.expert });
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
