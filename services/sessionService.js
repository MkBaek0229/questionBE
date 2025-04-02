import { getUserInfoService } from "./authService.js";
import { getExpertInfoService } from "./expertService.js";
import { getSuperUserInfoService } from "./superuserService.js";

export const checkSessionService = async (req) => {
  // 기관회원 세션 확인
  if (req.session.user) {
    const userInfo = await getUserInfoService(req.session.user.id);
    return {
      isLoggedIn: true,
      userType: "user",
      userData: userInfo,
    };
  }
  // 전문가 세션 확인
  else if (req.session.expert) {
    const expertInfo = await getExpertInfoService(req.session.expert.id);
    return {
      isLoggedIn: true,
      userType: "expert",
      userData: expertInfo,
    };
  }
  // 슈퍼유저 세션 확인
  else if (req.session.superuser) {
    const superUserInfo = await getSuperUserInfoService(
      req.session.superuser.id
    );
    return {
      isLoggedIn: true,
      userType: "superuser",
      userData: superUserInfo,
    };
  }

  // 로그인되지 않은 경우
  return {
    isLoggedIn: false,
    userType: null,
    userData: null,
  };
};
