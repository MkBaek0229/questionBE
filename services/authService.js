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

const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "로그아웃 실패" });
    }

    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    res.status(200).json({ message: "로그아웃 성공" });
  });
};

const getUserInfoService = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  res.status(200).json({ user: req.session.user });
};

export { registerUser, loginUser, logoutUser, getUserInfoService };
