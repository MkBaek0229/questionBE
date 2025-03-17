import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import dotenv from "dotenv";
import csrf from "csurf";
import path from "path";
import { fileURLToPath } from "url";
import csrfMiddleware from "../middlewares/csrf.js";
import errorHandler from "../middlewares/errorHandler.js"; // 에러 핸들링 미들웨어 추가

dotenv.config({ path: "questionBE/config/.env" }); // ⬅ `.env` 파일 경로 명시

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(
  session({
    secret: process.env.SESSION_SECRET, // 세션 시크릿 설정
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  })
);

app.use(helmet());
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }));

// ✅ CSRF 보호 활성화
app.use(csrf({ cookie: true }));
app.use(csrfMiddleware);

// ✅ **CSRF 토큰을 가져오는 엔드포인트 추가**
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ✅ 에러 핸들링 미들웨어 추가
app.use(errorHandler);

export default app;
