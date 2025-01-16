import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
//import { createClient } from "redis";

import { register, login, logout } from "./routes/auth.js";
import {
  registerExpert,
  loginExpert,
  logoutExpert,
} from "./routes/expert/expert.js";

import { sendVerificationEmail, verifyEmailCode } from "./routes/email.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies to be sent
  })
);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret", // Use a default if SESSION_SECRET is missing
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 3600000, // 1 hour
    },
  })
);

// const redisClient = createClient({
//   host: process.env.REDIS_HOST,
//   port: process.env.REDIS_PORT,
// });

// redisClient.on("error", (err) => console.error("Redis error:", err));
// await redisClient.connect();

// 기관회원 회원관리 Route
app.post("/register", register);
app.post("/login", login);
app.post("/logout", logout);

// 이메일 인증 관련 라우팅
app.post("/email/send-code", sendVerificationEmail); // 인증코드 전송
app.post("/email/verify-code", verifyEmailCode); // 인증코드 확인

// 전문가 회원관리 Route

// 전문가 회원관리 Route
app.post("/register/expert", registerExpert);
app.post("/login/expert", loginExpert);
app.post("/logout/expert", logoutExpert);

// Server initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
