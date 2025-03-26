import pool from "../config/db.js";

export const getRecentActivitiesService = async (userId) => {
  const systemActivities = await db.query(
    `SELECT 'register' AS type, system_name AS title, created_at AS date
     FROM systems WHERE user_id = ?`,
    [userId]
  );

  const diagnosisActivities = await db.query(
    `SELECT 'diagnosis' AS type, s.system_name AS title, sa.created_at AS date
     FROM self_assessment sa
     JOIN systems s ON sa.system_id = s.systems_id
     WHERE sa.is_completed = 1 AND sa.user_id = ?`,
    [userId]
  );

  const feedbackActivities = await db.query(
    `SELECT 'feedback' AS type, s.system_name AS title, f.created_at AS date
     FROM feedback f
     JOIN systems s ON f.system_id = s.systems_id
     WHERE f.user_id = ?`,
    [userId]
  );

  const combined = [
    ...systemActivities[0],
    ...diagnosisActivities[0],
    ...feedbackActivities[0],
  ];

  const sorted = combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  return sorted.slice(0, 5);
};
