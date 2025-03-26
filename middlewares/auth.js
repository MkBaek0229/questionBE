export const requireAuth = (req, res, next) => {
  if (!req.session?.user && !req.session?.expert) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  next();
};

// 슈퍼유저 전용 API 접근 제한
export const requireSuperUser = (req, res, next) => {
  if (!req.session?.superuser) {
    return res.status(403).json({ message: "슈퍼유저 권한이 필요합니다." });
  }
  next();
};
