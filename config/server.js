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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile =
  process.env.NODE_ENV === "production" ? ".env.docker" : ".env.development";

dotenv.config({ path: path.join(__dirname, envFile) });
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
      maxAge: 1000 * 60 * 60, // 1시간 세션 유지
      sameSite: "lax",
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
