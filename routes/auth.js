import bcrypt from "bcrypt";
import pool from "../db/connection.js"; // DB 연결 파일

// 회원가입
const register = async (req, res) => {
  const {
    institution_name,
    institution_address,
    representative_name,
    email,
    password,
    phone,
  } = req.body;

  try {
    const [existingUser] = await pool.query(
      "SELECT * FROM User WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO User (institution_name, institution_address, representative_name, email, password, phone_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        institution_name,
        institution_address,
        representative_name,
        email,
        hashedPassword,
        phone,
      ]
    );

    res.status(201).json({ message: "회원가입 성공!" });
  } catch (err) {
    console.error("회원가입 실패:", err); // 오류 로그 추가
    res.status(500).json({ message: "회원가입 실패", error: err.message });
  }
};

// 로그인
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [user] = await pool.query("SELECT * FROM User WHERE email = ?", [
      email,
    ]);
    if (user.length === 0) {
      return res
        .status(400)
        .json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    req.session.user = {
      id: user[0].id,
      email: user[0].email,
      name: user[0].representative_name,
    };

    res.status(200).json({ message: "로그인 성공", user: req.session.user });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 로그아웃
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "로그아웃 실패" });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "로그아웃 성공" });
  });
};

// 사용자 정보 가져오기
const getUserInfo = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  res.status(200).json({ user: req.session.user });
};

export { register, login, logout, getUserInfo };
