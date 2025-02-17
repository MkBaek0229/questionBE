import pool from "../db/connection.js";

// 점수 및 등급 계산 함수
const calculateAssessmentScore = async (systemId) => {
  console.log("Calculating score for systemId:", systemId);

  // ✅ 점수를 DB에서 가져와 동적으로 계산하도록 변경
  const queryQuantitative = `
    SELECT qr.response, 
           qq.score_fulfilled, 
           qq.score_unfulfilled, 
           qq.score_consult, 
           qq.score_not_applicable
    FROM quantitative_responses qr
    JOIN quantitative_questions qq ON qr.question_id = qq.id
    WHERE qr.systems_id = ?;
  `;

  const queryQualitative = `
    SELECT qr.response, 
           qq.score_consult, 
           qq.score_not_applicable
    FROM qualitative_responses qr
    JOIN qualitative_questions qq ON qr.question_id = qq.id
    WHERE qr.systems_id = ?;
  `;

  try {
    const [quantitativeResults] = await pool.query(queryQuantitative, [
      systemId,
    ]);
    const [qualitativeResults] = await pool.query(queryQualitative, [systemId]);

    console.log("Quantitative results:", quantitativeResults);
    console.log("Qualitative results:", qualitativeResults);

    let score = 0;

    // 정량 평가 점수 계산
    quantitativeResults.forEach((item) => {
      if (item.response === "이행") score += parseFloat(item.score_fulfilled);
      else if (item.response === "미이행")
        score += parseFloat(item.score_unfulfilled);
      else if (item.response === "자문필요")
        score += parseFloat(item.score_consult);
      else if (item.response === "해당없음")
        score += parseFloat(item.score_not_applicable);
    });

    // 정성 평가 점수 계산
    qualitativeResults.forEach((item) => {
      if (item.response === "자문필요") score += parseFloat(item.score_consult);
      else if (item.response === "해당없음")
        score += parseFloat(item.score_not_applicable);
    });

    console.log("✅ [DEBUG] 최종 계산된 점수:", score);

    let grade;

    switch (true) {
      case score >= 90:
        grade = "S";
        break;
      case score >= 80:
        grade = "A";
        break;
      case score >= 70:
        grade = "B";
        break;
      case score >= 60:
        grade = "C";
        break;
      default:
        grade = "D";
    }

    console.log("Calculated grade:", grade);

    return { score, grade };
  } catch (error) {
    console.error("❌ [ERROR] 점수 계산 실패:", error.message);
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

  console.log(
    "🔄 [DEBUG] completeSelfTest 실행 - systemId:",
    systemId,
    "userId:",
    userId
  );

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [selfAssessmentResult] = await connection.query(
      "SELECT id FROM self_assessment WHERE systems_id = ? AND user_id = ?",
      [systemId, userId]
    );

    if (selfAssessmentResult.length === 0) {
      await connection.rollback();
      console.error("⚠️ [WARNING] self_assessment에 데이터 없음:", {
        systemId,
        userId,
      });
      return res.status(404).json({
        message: "자가진단 입력 데이터가 없습니다.",
      });
    }

    const assessmentId = selfAssessmentResult[0].id;
    console.log("✅ [DEBUG] Retrieved assessment_id:", assessmentId);

    const { score, grade } = await calculateAssessmentScore(systemId);
    console.log("✅ [DEBUG] 계산된 점수 및 등급:", { score, grade });

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
    console.log("📡 [DEBUG] 실행할 쿼리:", query, "params:", values);

    await connection.query(query, values);

    await connection.commit();
    console.log("✅ [DEBUG] 자가진단 결과가 성공적으로 저장됨");

    res.status(200).json({
      message: "자가진단 결과가 성공적으로 저장되었습니다.",
      score,
      grade,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ [ERROR] 자가진단 완료 실패:", error.message);
    res.status(500).json({
      message: "서버 내부 오류 발생",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

const getAssessmentResults = async (req, res) => {
  try {
    const { userId, systemId } = req.query;

    console.log("📡 [DEBUG] 결과 데이터 요청 수신:", { userId, systemId });

    if (!userId || !systemId) {
      return res.status(400).json({ message: "필수 정보가 누락되었습니다." });
    }

    // 🛑 Debug: 쿼리를 실행하기 전에 MySQL 연결 확인
    console.log("📡 [DEBUG] MySQL 연결 확인 중...");

    const query = `
      SELECT * FROM assessment_result
      WHERE user_id = ? AND systems_id = ?
      ORDER BY completed_at DESC
    `;

    console.log("📡 [DEBUG] 실행할 쿼리:", query, "params:", [
      userId,
      systemId,
    ]);

    const [results] = await pool.query(query, [userId, systemId]);

    if (results.length === 0) {
      console.warn("⚠️ [WARNING] 결과 데이터 없음:", { userId, systemId });
      return res.status(404).json({ message: "진단 결과가 없습니다." });
    }

    console.log("✅ [DEBUG] 결과 데이터 반환:", results);
    res.status(200).json(results);
  } catch (error) {
    console.error("❌ [ERROR] 결과 데이터 조회 실패:", error);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
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

const getCategoryProtectionScores = async (req, res) => {
  const { systemId } = req.params;

  try {
    // 현재 보호 수준 계산
    const [currentScores] = await pool.query(
      `
          SELECT 
              c.name AS category_name, 
              AVG(
                  CASE 
                      WHEN qr.response = '이행' THEN qq.score_fulfilled
                      WHEN qr.response = '자문필요' THEN qq.score_consult
                      WHEN qr.response = '미이행' THEN qq.score_unfulfilled
                      WHEN qr.response = '해당없음' THEN qq.score_not_applicable
                      ELSE 0 
                  END
              ) AS avg_score
          FROM quantitative_responses qr
          JOIN quantitative_questions qq ON qr.question_id = qq.id
          JOIN categories c ON qq.category_id = c.id
          WHERE qr.systems_id = ?
          GROUP BY c.name
          ORDER BY avg_score DESC
      `,
      [systemId]
    );

    // 최대 보호 수준 계산
    const [maxScores] = await pool.query(`
          SELECT 
              c.name AS category_name, 
              MAX(qq.score_fulfilled) AS max_score
          FROM quantitative_questions qq
          JOIN categories c ON qq.category_id = c.id
          GROUP BY c.name
      `);

    // 결과 매핑 (현재 보호 수준 vs 최대 보호 수준)
    const categoryScores = currentScores.map((cs) => {
      const maxScore =
        maxScores.find((ms) => ms.category_name === cs.category_name)
          ?.max_score || 5; // 기본 최대점수 5점
      return {
        category: cs.category_name,
        currentScore: cs.avg_score,
        maxScore: maxScore,
      };
    });

    res.json(categoryScores);
  } catch (error) {
    console.error("❌ [ERROR] 분야별 보호 수준 조회 실패:", error);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

export {
  completeSelfTest,
  getAssessmentResults,
  getAssessmentStatuses,
  getCategoryProtectionScores,
};
