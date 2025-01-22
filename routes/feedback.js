import pool from "../db/connection.js";

/**
 * 🔹 전문가가 배정된 시스템 목록 조회
 */
const getAssignedSystems = async (req, res) => {
  const { expertId } = req.query;

  if (!expertId) {
    return res.status(400).json({ message: "전문가 ID가 필요합니다." });
  }

  try {
    const query = `
      SELECT s.id AS system_id, s.name AS system_name, u.institution_name, 
             ar.score, ar.grade, ar.feedback_status
      FROM assignment a
      JOIN systems s ON a.systems_id = s.id
      JOIN User u ON s.user_id = u.id
      LEFT JOIN assessment_result ar ON s.id = ar.system_id
      WHERE a.expert_id = ?;
    `;

    const [results] = await pool.query(query, [expertId]);

    if (results.length === 0) {
      return res.status(404).json({ message: "배정된 시스템이 없습니다." });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("배정된 시스템 조회 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

/**
 * 🔹 특정 시스템의 자가진단 결과 조회
 */
const getSystemAssessmentResult = async (req, res) => {
  const { systemId } = req.query;

  if (!systemId) {
    return res.status(400).json({ message: "시스템 ID가 필요합니다." });
  }

  try {
    const query = `
      SELECT ar.id AS assessment_id, ar.system_id, ar.user_id, ar.score, 
             ar.grade, ar.feedback_status, ar.completed_at, u.institution_name
      FROM assessment_result ar
      JOIN systems s ON ar.system_id = s.id
      JOIN User u ON s.user_id = u.id
      WHERE ar.system_id = ?;
    `;

    const [results] = await pool.query(query, [systemId]);

    if (results.length === 0) {
      return res.status(404).json({ message: "자가진단 결과가 없습니다." });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    console.error("자가진단 결과 조회 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

/**
 * 🔹 자가진단 결과에 피드백 추가
 */
const addFeedback = async (req, res) => {
  const { assessmentId, expertId, feedbackContent } = req.body;

  if (!assessmentId || !expertId || !feedbackContent) {
    return res.status(400).json({ message: "모든 필드를 입력해야 합니다." });
  }

  try {
    const query = `
      INSERT INTO feedback (assessment_result_id, assignment_id, feedback_content)
      VALUES (?, (SELECT id FROM assignment WHERE expert_id = ? AND systems_id = 
                 (SELECT system_id FROM assessment_result WHERE id = ?)), ?)
      ON DUPLICATE KEY UPDATE feedback_content = VALUES(feedback_content);
    `;

    await pool.query(query, [
      assessmentId,
      expertId,
      assessmentId,
      feedbackContent,
    ]);

    // 피드백을 추가하면 assessment_result의 상태도 업데이트
    await pool.query(
      `
      UPDATE assessment_result 
      SET feedback_status = '전문가 자문이 반영되었습니다' 
      WHERE id = ?;
    `,
      [assessmentId]
    );

    res.status(200).json({ message: "피드백이 성공적으로 저장되었습니다." });
  } catch (error) {
    console.error("피드백 저장 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

/**
 * 🔹 자가진단 결과 피드백 수정
 */
const updateFeedback = async (req, res) => {
  const { assessmentId, expertId, feedbackContent } = req.body;

  if (!assessmentId || !expertId || !feedbackContent) {
    return res.status(400).json({ message: "모든 필드를 입력해야 합니다." });
  }

  try {
    const query = `
      UPDATE feedback 
      SET feedback_content = ? 
      WHERE assessment_result_id = ? 
      AND assignment_id = (SELECT id FROM assignment WHERE expert_id = ? 
                           AND systems_id = (SELECT system_id FROM assessment_result WHERE id = ?));
    `;

    const [result] = await pool.query(query, [
      feedbackContent,
      assessmentId,
      expertId,
      assessmentId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "피드백을 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "피드백이 성공적으로 수정되었습니다." });
  } catch (error) {
    console.error("피드백 수정 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};
/**
 * 🔹 전문가가 특정 시스템에 대해 작성한 피드백 단건 조회
 * GET /feedback?expertId=EXPERT_ID&systemId=SYSTEM_ID
 */
const GetFeedbackBySystem = async (req, res) => {
  const { expertId, systemId } = req.query;

  if (!expertId || !systemId) {
    return res
      .status(400)
      .json({ message: "전문가 ID와 시스템 ID가 필요합니다." });
  }

  try {
    // ✅ 먼저 전문가가 해당 시스템에 배정되었는지 확인
    const checkAssignmentQuery = `
      SELECT id FROM assignment WHERE expert_id = ? AND systems_id = ?;
    `;
    const [assignment] = await pool.query(checkAssignmentQuery, [
      expertId,
      systemId,
    ]);

    if (assignment.length === 0) {
      return res.status(403).json({
        message: "해당 시스템에 대한 피드백을 조회할 권한이 없습니다.",
      });
    }

    // ✅ 피드백 조회
    const feedbackQuery = `
      SELECT 
          f.id AS feedback_id,
          f.feedback_content,
          f.created_at
      FROM feedback f
      JOIN assignment a ON f.assignment_id = a.id
      WHERE a.expert_id = ? AND a.systems_id = ?;
    `;

    const [feedback] = await pool.query(feedbackQuery, [expertId, systemId]);

    if (feedback.length === 0) {
      return res.status(404).json({ message: "작성한 피드백이 없습니다." });
    }

    res.status(200).json(feedback[0]);
  } catch (error) {
    console.error("전문가 피드백 조회 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

/**
 * 🔹 기관회원이 등록한 시스템의 자가진단 결과 및 전문가 피드백 조회
 * GET /systems-results?userId=기관회원ID
 */
const SystemsResult = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "기관회원 ID가 필요합니다." });
  }

  try {
    const query = `
        SELECT s.id AS system_id, s.name AS system_name, 
               ar.score, ar.grade, ar.feedback_status, ar.completed_at,
               f.feedback_content, e.name AS expert_name
        FROM systems s
        LEFT JOIN assessment_result ar ON s.id = ar.system_id
        LEFT JOIN assignment a ON s.id = a.systems_id
        LEFT JOIN feedback f ON ar.id = f.assessment_result_id
        LEFT JOIN expert e ON a.expert_id = e.id
        WHERE s.user_id = ?;
      `;

    const [results] = await pool.query(query, [userId]);

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "등록된 시스템이 없거나 자가진단 결과가 없습니다." });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("기관회원 시스템 결과 조회 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

/**
 * 🔹 전문가가 배정된 시스템 정보 조회
 * GET /system-details
 */

const getSystemDetails = async (req, res) => {
  const { expertId, systemId } = req.query;

  if (!expertId || !systemId) {
    return res
      .status(400)
      .json({ message: "전문가 ID와 시스템 ID가 필요합니다." });
  }

  try {
    // 전문가가 해당 시스템에 배정되었는지 확인
    const assignmentQuery = `
      SELECT * FROM assignment
      WHERE expert_id = ? AND systems_id = ?
    `;
    const [assignment] = await pool.query(assignmentQuery, [
      expertId,
      systemId,
    ]);

    if (assignment.length === 0) {
      return res
        .status(403)
        .json({ message: "해당 시스템에 대한 접근 권한이 없습니다." });
    }

    // 시스템 정보 조회
    const systemQuery = `
      SELECT 
        s.id AS system_id, 
        s.name AS system_name, 
        s.min_subjects, 
        s.max_subjects, 
        s.purpose, 
        s.is_private, 
        s.is_unique, 
        s.is_resident, 
        s.reason, 
        s.assessment_status,
        u.institution_name
      FROM systems s
      JOIN User u ON s.user_id = u.id
      WHERE s.id = ?
    `;
    const [systemInfo] = await pool.query(systemQuery, [systemId]);

    if (systemInfo.length === 0) {
      return res
        .status(404)
        .json({ message: "시스템 정보를 찾을 수 없습니다." });
    }

    res.status(200).json(systemInfo[0]); // 시스템 정보 반환
  } catch (error) {
    console.error("시스템 정보 조회 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

export {
  getAssignedSystems,
  getSystemAssessmentResult,
  addFeedback,
  updateFeedback,
  GetFeedbackBySystem,
  SystemsResult,
  getSystemDetails,
};
