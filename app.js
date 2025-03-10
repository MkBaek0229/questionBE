import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { getUploadMiddleware } from "./routes/upload.js";
import csrf from "csurf";
import helmet from "helmet";
import validateUserInput from "./middlewares/validation.js";
import { register, login, logout, getUserInfo } from "./routes/auth.js";
import {
  registerExpert,
  loginExpert,
  logoutExpert,
  getExpertInfo,
} from "./routes/expert.js";
import { postsystem, getsystems, deleteSystem } from "./routes/system.js";
import {
  findPassword,
  resetPassword,
  sendVerificationCode,
  verifyCode,
} from "./routes/email.js";
import {
  handleSelfAssessmentSave,
  getQuantitativeQuestions,
  getQualitativeQuestions,
  submitQuantitativeResponses,
  submitQualitativeResponses,
  getQuantitativeResponses,
  getQualitativeResponses,
  updateQuantitativeQuestion,
  updateQualitativeQuestion,
} from "./routes/selftest.js";
import {
  completeSelfTest,
  getAssessmentResults,
  getAssessmentStatuses,
  getCategoryProtectionScores,
} from "./routes/result.js";
import {
  getAssignedSystems,
  getSystemAssessmentResult,
  submitQuantitativeFeedback,
  submitQualitativeFeedback,
  SystemsResult,
  updateFeedbackStatus,
  getSystemOwner,
  getFeedbacks,
} from "./routes/feedback.js";
import {
  getAllUsers,
  getUserById,
  deleteUser,
  getAllExperts,
  getExpertById,
  deleteExpert,
  loginSuperUser,
  matchExpertsToSystem,
  getMatchedExperts,
  getAllSystems,
  logoutSuperUser,
  deleteSystemBySuperUser,
  SupergetQuantitativeQuestions,
  SupergetQualitativeQuestions,
  SupergetQuantitativeResponses,
  SupergetQualitativeResponses,
  getSystemById,
  addQuantitativeQuestion,
  editQuantitativeQuestion,
  deleteQuantitativeQuestion,
  addQualitativeQuestion,
  editQualitativeQuestion,
  deleteQualitativeQuestion,
  getCategories,
  deleteCategory,
  updateCategory,
  addCategory,
} from "./routes/superuser.js";
import { get } from "http";

dotenv.config();
const __filename = fileURLToPath(import.meta.url); // ✅ 현재 파일 경로 변환
const __dirname = path.dirname(__filename); // ✅ 현재 디렉토리 경로 변환

const app = express();
app.use(express.json()); // 📌 JSON 요청 본문을 해석
app.use(express.urlencoded({ extended: true })); // 📌 URL 인코딩된 데이터 해석

// ✅ 미들웨어 설정
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ 보안 헤더 설정 (helmet 적용)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://apis.google.com"], // 필요시 외부 도메인 추가
        objectSrc: ["'none'"], // 플러그인 및 임베딩 차단
        upgradeInsecureRequests: [], // HTTP 요청을 HTTPS로 변환
      },
    },
    xssFilter: true, // XSS 공격 방지
    frameguard: { action: "deny" }, // Clickjacking 방지
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // HTTPS 강제
    noSniff: true, // MIME 스니핑 방지
    hidePoweredBy: true, // "X-Powered-By: Express" 제거
  })
);
// ✅ CORS 설정
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    credentials: true,
  })
);
// ✅ CSRF 보호 미들웨어 적용
const csrfProtection = csrf({ cookie: true });

// ✅ CSRF 미들웨어를 모든 요청 전에 실행
app.use(csrfProtection);

// ✅ 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // 자바스크립트를 통한 쿠키 접근 차단 (XSS 방지)
      secure: process.env.NODE_ENV === "production", // HTTPS 에서만 쿠키 전송
      sameSite: "strict", // CSRF 방지 (엄격한 쿠키 정책)
      maxAge: 1000 * 60 * 30, // 세션 유지시간 (30분)
    },
  })
);
//세션 타임아웃
app.use((req, res, next) => {
  const now = Date.now();
  const sessionMaxAge = 1000 * 60 * 30; // 30분

  if (req.session.lastAccess && now - req.session.lastAccess > sessionMaxAge) {
    req.session.destroy(() => {
      res
        .status(401)
        .json({ message: "세션이 만료되었습니다. 다시 로그인해 주세요." });
    });
  } else {
    req.session.lastAccess = now;
    next();
  }
});
// ✅ 인증 미들웨어
const requireAuth = (req, res, next) => {
  if (!req.session?.user && !req.session?.expert && !req.session?.superuser) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  next();
};

// ✅ 슈퍼유저 전용 인증 미들웨어
const requireSuperUser = (req, res, next) => {
  if (!req.session?.superuser) {
    return res.status(403).json({ message: "슈퍼유저 권한이 필요합니다." });
  }
  next();
};

// ✅ 요청 로깅
app.use((req, res, next) => {
  console.log(
    `[${req.method}] ${req.path} - BODY SIZE:`,
    req.headers["content-length"]
  );
  next();
});

// ✅ CSRF 토큰을 클라이언트에 제공하는 API
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ✅ POST, PUT, DELETE 요청에서만 CSRF 보호 적용
app.use((req, res, next) => {
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

// 📌 1. 슈퍼유저가 문항 추가할 때 (이미지 업로드)
app.post(
  "/upload/question-image",
  csrfProtection,
  getUploadMiddleware("image").single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "파일이 없습니다." });
    }
    res.json({ url: `/uploads/questions/${req.file.filename}` });
  }
);

// 📌 2. 사용자가 자가진단 응답할 때 (문서 업로드)
app.post(
  "/upload/response-file",
  csrfProtection,
  getUploadMiddleware("document").single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "파일이 없습니다." });
    }

    res.json({ url: `/uploads/responses/${req.file.filename}` });
  }
);

// ✅ 기관회원 라우트
app.post("/register", validateUserInput, csrfProtection, register);
app.post("/login", csrfProtection, login);
app.post("/logout", csrfProtection, logout);
app.get("/user", requireAuth, getUserInfo);

// ✅ 전문가 회원 라우트
app.post("/register/expert", validateUserInput, csrfProtection, registerExpert);
app.post("/login/expert", csrfProtection, loginExpert);
app.post("/logout/expert", csrfProtection, logoutExpert);
app.get("/expert", requireAuth, getExpertInfo);

// ✅ 슈퍼유저 라우트
app.post("/login/superuser", csrfProtection, loginSuperUser);
app.post(
  "/match-experts",
  csrfProtection,
  requireSuperUser,
  matchExpertsToSystem
);
app.get("/matched-experts", requireSuperUser, getMatchedExperts);
app.post(
  "/logout/SuperUser",
  csrfProtection,
  requireSuperUser,
  logoutSuperUser
);
app.delete(
  "/system/superuser/:id",
  csrfProtection,
  requireSuperUser,
  deleteSystemBySuperUser
);
app.get("/system/:id", requireSuperUser, getSystemById);

// ✅ 슈퍼유저용 정량적 질문 조회
app.get(
  "/super/selftest/quantitative",
  requireSuperUser,
  SupergetQuantitativeQuestions
);

// ✅ 슈퍼유저용 정성적 질문 조회
app.get(
  "/super/selftest/qualitative",
  requireSuperUser,
  SupergetQualitativeQuestions
);

// ✅ 특정 시스템의 정량적 응답 조회 (userId 없이 systemId만 사용)
app.get(
  "/super/selftest/quantitative/responses/:systemId",
  requireSuperUser,
  SupergetQuantitativeResponses
);

// ✅ 특정 시스템의 정성적 응답 조회
app.get(
  "/super/selftest/qualitative/responses/:systemId",
  requireSuperUser,
  SupergetQualitativeResponses
);
// ✅ 유저 목록 조회
app.get("/superuser/users", requireSuperUser, getAllUsers);

// ✅ 특정 유저 조회
app.get("/superuser/user/:id", requireSuperUser, getUserById);

// ✅ 유저 삭제
app.delete("/superuser/user/:id", csrfProtection, requireSuperUser, deleteUser);

// ✅ 관리자 목록 조회
app.get("/superuser/experts", requireSuperUser, getAllExperts);

// ✅ 특정 관리자 조회
app.get("/superuser/expert/:id", requireSuperUser, getExpertById);

// ✅ 관리자 삭제
app.delete(
  "/superuser/expert/:id",
  csrfProtection,
  requireSuperUser,
  deleteExpert
);
// 정량 문항 API

// ✅ 카테고리 목록 조회
app.get("/categories", getCategories);

// ✅ 카테고리 추가
app.post("/categories/add", addCategory);

// ✅ 카테고리 수정
app.put("/categories/edit/:categoryId", updateCategory);

// ✅ 카테고리 삭제
app.delete("/categories/delete/:categoryId", deleteCategory);

// ✅ 정량 문항 관리 (슈퍼유저 전용)
app.post(
  "/super/selftest/quantitative/add",
  csrfProtection,
  requireSuperUser,
  addQuantitativeQuestion
);
app.put(
  "/super/selftest/quantitative/put/:id",
  csrfProtection,
  requireSuperUser,
  editQuantitativeQuestion
);
app.delete(
  "/super/selftest/quantitative/del/:id",
  csrfProtection,
  requireSuperUser,
  deleteQuantitativeQuestion
);

// 정성 문항 API
app.post(
  "/super/selftest/qualitative/add",
  csrfProtection,
  addQualitativeQuestion
);
app.put(
  "/super/selftest/qualitative/put/:id",
  csrfProtection,
  editQualitativeQuestion
);
app.delete(
  "/super/selftest/qualitative/del/:id",
  csrfProtection,
  deleteQualitativeQuestion
);

// ✅ 이메일 인증 라우트
app.post("/email/send-verification-code", csrfProtection, sendVerificationCode);
app.post("/email/verify-code", csrfProtection, verifyCode);

// ✅ 비밀번호 찾기 & 재설정
app.post("/find-password", findPassword);
app.post("/reset-password", resetPassword);

// ✅ 시스템 라우트
app.post("/systems", requireAuth, csrfProtection, postsystem);
app.get("/systems", requireAuth, getsystems);
app.get("/all-systems", requireSuperUser, getAllSystems);
app.delete("/system/:id", requireAuth, csrfProtection, deleteSystem);

// ✅ 자가진단(자가평가) 라우트
app.post(
  "/user/selftest/quantitative",
  csrfProtection,
  requireAuth,
  submitQuantitativeResponses
);
app.post(
  "/user/selftest/qualitative",
  csrfProtection,
  requireAuth,
  submitQualitativeResponses
);
app.post("/selftest", csrfProtection, requireAuth, handleSelfAssessmentSave);
app.get("/selftest/quantitative", requireAuth, getQuantitativeQuestions);
app.get("/selftest/qualitative", requireAuth, getQualitativeQuestions);
app.get(
  "/selftest/quantitative/responses/:systemId/:userId",
  requireAuth,
  getQuantitativeResponses
);
app.get(
  "/selftest/qualitative/responses/:systemId/:userId",
  requireAuth,
  getQualitativeResponses
);
app.put("/update-quantitative", csrfProtection, updateQuantitativeQuestion);
app.put("/update-qualitative", csrfProtection, updateQualitativeQuestion);
// ✅ 평가 결과 라우트
app.post("/assessment/complete", csrfProtection, requireAuth, completeSelfTest);
app.get("/assessment/result", requireAuth, getAssessmentResults);
app.get("/assessment/status", requireAuth, getAssessmentStatuses);

// ✅ 전문가 관련 라우트
app.get("/assigned-systems", requireAuth, getAssignedSystems);
app.get("/system-result", requireAuth, getSystemAssessmentResult);
app.get("/systems-results", requireAuth, SystemsResult);
app.get("/system-owner", getSystemOwner);

// ✅ 피드백 라우트
app.post(
  "/selftest/quantitative/feedback",
  csrfProtection,
  requireAuth,
  submitQuantitativeFeedback
);
app.post(
  "/selftest/qualitative/feedback",
  csrfProtection,
  requireAuth,
  submitQualitativeFeedback
);
app.post(
  "/selftest/qualitative/update-status",
  csrfProtection,
  requireAuth,
  updateFeedbackStatus
);
app.get("/selftest/feedback", getFeedbacks);

// ✅ 평가 결과 API 라우트
app.post("/assessment/complete", csrfProtection, requireAuth, completeSelfTest);
app.get("/assessment/result", requireAuth, getAssessmentResults);
app.get("/assessment/status", requireAuth, getAssessmentStatuses);

// ✅ 진단 분야별 보호 수준 조회 (현재 vs 최대)
app.get("/category-scores/:systemId", getCategoryProtectionScores);
// ✅ 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error(`서버 에러 발생 [${req.method} ${req.path}]:`, err);
  res
    .status(500)
    .json({ message: "서버 오류가 발생했습니다.", error: err.message });
});

// ✅ 404 에러 처리
app.use((req, res) => {
  res
    .status(404)
    .json({ message: `요청한 경로를 찾을 수 없습니다: ${req.path}` });
});

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
