import { getRecentActivitiesService } from "../services/activityService.js";

export const getRecentActivities = async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const activities = await getRecentActivitiesService(userId);
    res.json(activities);
  } catch (error) {
    console.error("❌ 최근 활동 컨트롤러 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
};
