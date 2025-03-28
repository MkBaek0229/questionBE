import dotenv from "dotenv";
import app from "./config/server.js";

import authRoutes from "./routes/auth.js";
import emailRoutes from "./routes/email.js";
import expertRoutes from "./routes/expert.js";
import feedbackRoutes from "./routes/feedback.js";
import resultRoutes from "./routes/result.js";
import selftestRoutes from "./routes/selftest.js";
import superuserRoutes from "./routes/superuser.js";
import systemRoutes from "./routes/system.js";
import uploadRoutes from "./routes/upload.js";
import errorHandler from "./middlewares/errorHandler.js";
// 다른 라우트 파일들도 여기에 추가합니다.

dotenv.config();

app.use("/auth", authRoutes);
app.use("/email", emailRoutes);
app.use("/expert", expertRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/result", resultRoutes);
app.use("/selftest", selftestRoutes);
app.use("/superuser", superuserRoutes);
app.use("/system", systemRoutes);
app.use("/upload", uploadRoutes);

// 마지막에 에러 핸들러 등록
app.use(errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
