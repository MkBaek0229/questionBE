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
    phone_number,
  } = req.body;

  console.log("📩 받은 데이터:", req.body);
  const connection = await pool.getConnection(); // ✅ 트랜잭션 시작을 위해 DB 커넥션 가져오기

  try {
    await connection.beginTransaction(); // ✅ 트랜잭션 시작

    const [existingUser] = await connection.query(
      "SELECT * FROM User WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      throw new Error("이미 사용 중인 이메일입니다.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("🚀 INSERT 실행 시작!");
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
    await connection.commit(); // ✅ 모든 작업이 성공하면 커밋!
    console.log("✅ 회원가입 완료!");
    res.status(201).json({ message: "회원가입 성공!" });
  } catch (err) {
    await connection.rollback(); // 🚨 실패하면 ROLLBACK!
    console.error("회원가입 실패, 롤백됨:", err);
    res.status(500).json({ message: "회원가입 실패", error: err.message });
  } finally {
    connection.release(); // ✅ 연결 반환
  }
};
// 로그인
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [user] = await pool.query("SELECT * FROM User WHERE email = ?", [
      email,
    ]);
    if (!user || user.length === 0) {
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
      member_type: "user",
    };

    res.status(200).json({
      resultCode: "S-1",
      message: "로그인 성공",
      data: req.session.user,
    });
  } catch (error) {
    console.error("❌ [EXPERT LOGIN] 로그인 오류:", error);
    res
      .status(500)
      .json({ resultCode: "F-1", msg: "서버 에러 발생", error: error.message });
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
