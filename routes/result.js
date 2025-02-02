import pool from "../db/connection.js";

// 점수 및 등급 계산 함수
const calculateAssessmentScore = async (systemId) => {
  console.log("Calculating score for systemId:", systemId);

  // ✅ 변경된 테이블 구조 반영
  const queryQuantitative = `SELECT response FROM quantitative_responses WHERE systems_id = ?`;
  const queryQualitative = `SELECT response FROM qualitative_responses WHERE systems_id = ?`;

  try {
    const [quantitativeResults] = await pool.query(queryQuantitative, [
      systemId,
    ]);
    const [qualitativeResults] = await pool.query(queryQualitative, [systemId]);

    console.log("Quantitative results:", quantitativeResults);
    console.log("Qualitative results:", qualitativeResults);

    let score = 0;

    // ✅ 정량 평가 점수 계산
    quantitativeResults.forEach((item) => {
      if (item.response === "이행") score += 1;
      else if (item.response === "자문필요") score += 0.3;
    });

    // ✅ 정성 평가 점수 계산
    qualitativeResults.forEach((item) => {
      if (item.response === "자문필요") score += 0.3;
    });

    console.log("Calculated score:", score);

    let grade = "D";
    if (score >= 80) grade = "S";
    else if (score >= 60) grade = "A";
    else if (score >= 40) grade = "B";
    else if (score >= 20) grade = "C";

    console.log("Calculated grade:", grade);

    return { score, grade };
  } catch (error) {
    console.error("점수 계산 실패:", error.message);
    throw error;
  }
};

// 자가진단 완료 처리
const completeSelfTest = async (req, res) => {
  const { systemId, userId } = req.body;

  if (!systemId || !userId) {
    return res.status(400).json({
      message: "유효하지 않은 요청입니다. systemId와 userId를 확인하세요.",
    });
  }

  console.log("completeSelfTest called with:", { systemId, userId });

  try {
    // ✅ 1️⃣ `assessment_id`를 `self_assessment`에서 조회
    const [selfAssessmentResult] = await pool.query(
      "SELECT id FROM self_assessment WHERE systems_id = ? AND user_id = ?",
      [systemId, userId]
    );

    if (selfAssessmentResult.length === 0) {
      return res.status(404).json({
        message: "자가진단 입력 데이터가 없습니다.",
      });
    }
    const assessmentId = selfAssessmentResult[0].id; // 조회한 자가진단 입력 ID
    console.log("✅ Retrieved assessment_id:", assessmentId);
    // ✅ 2️⃣ 점수 및 등급 계산
    const { score, grade } = await calculateAssessmentScore(systemId);

    console.log("Calculated score and grade:", { score, grade });

    // ✅ 3️⃣ `assessment_id` 포함하여 결과 저장
    const query = `
     INSERT INTO assessment_result (systems_id, user_id, assessment_id, score, feedback_status, completed_at, grade)
     VALUES (?, ?, ?, ?, '전문가 자문이 반영되기전입니다', NOW(), ?)
     ON DUPLICATE KEY UPDATE
     score = VALUES(score),
     feedback_status = VALUES(feedback_status),
     completed_at = VALUES(completed_at),
     grade = VALUES(grade);

    `;
    const values = [systemId, userId, assessmentId, score, grade];
    console.log("Executing query:", query, "with values:", values);

    await pool.query(query, values);

    res.status(200).json({
      message: "자가진단 결과가 성공적으로 저장되었습니다.",
      score,
      grade,
    });
  } catch (error) {
    console.error("자가진단 완료 실패:", error.message);
    res.status(500).json({
      message: "서버 내부 오류 발생",
      error: error.message,
    });
  }
};

// 결과 조회 처리
const getAssessmentResults = async (req, res) => {
  const { userId, systemId } = req.query;

  console.log("Received query parameters:", { userId, systemId });

  if (!userId || !systemId) {
    return res.status(400).json({
      message: "유효하지 않은 요청입니다. userId와 systemId를 확인하세요.",
    });
  }

  const query = `
  SELECT ar.id, ar.systems_id, ar.score, ar.feedback_status, ar.grade, ar.completed_at,
         s.name AS system_name
  FROM assessment_result ar
  JOIN systems s ON ar.systems_id = s.id
  WHERE ar.user_id = ? AND ar.systems_id = ?
  ORDER BY ar.completed_at DESC
  LIMIT 1
`;
  const values = [userId, systemId];

  try {
    const [results] = await pool.query(query, values);

    console.log("Query results:", results);

    if (results.length === 0) {
      return res.status(404).json({
        message: "결과가 존재하지 않습니다.",
      });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching assessment results:", error.message);
    res.status(500).json({
      message: "서버 내부 오류 발생",
      error: error.message,
    });
  }
};

const getAssessmentStatuses = async (req, res) => {
  try {
    const query = `
      SELECT systems_id, COUNT(*) > 0 AS is_completed
      FROM assessment_result
      GROUP BY systems_id
    `;
    const [results] = await pool.query(query);

    // 결과를 객체 형태로 변환
    const statusMap = results.reduce((acc, row) => {
      acc[row.systems_id] = row.is_completed;
      return acc;
    }, {});

    res.status(200).json(statusMap);
  } catch (error) {
    console.error("진단 상태 조회 실패:", error.message);
    res.status(500).json({
      message: "서버 오류로 진단 상태를 가져오지 못했습니다.",
      error: error.message,
    });
  }
};
export { completeSelfTest, getAssessmentResults, getAssessmentStatuses };
