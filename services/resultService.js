import pool from "../config/db.js";

const calculateAssessmentScore = async (systemId, diagnosisRound) => {
  const queryQuantitative = `
    SELECT qr.response, 
           qq.score_fulfilled, 
           qq.score_unfulfilled, 
           qq.score_consult, 
           qq.score_not_applicable
    FROM quantitative_responses qr
    JOIN quantitative_questions qq ON qr.question_id = qq.id
    WHERE qr.systems_id = ? AND qr.diagnosis_round = ?;
  `;

  const queryQualitative = `
    SELECT qr.response, 
           qq.score_consult, 
           qq.score_not_applicable
    FROM qualitative_responses qr
    JOIN qualitative_questions qq ON qr.question_id = qq.id
    WHERE qr.systems_id = ? AND qr.diagnosis_round = ?;
  `;

  try {
    const [quantitativeResults] = await pool.query(queryQuantitative, [
      systemId,
      diagnosisRound,
    ]);
    const [qualitativeResults] = await pool.query(queryQualitative, [
      systemId,
      diagnosisRound,
    ]);

    console.log("Quantitative results:", quantitativeResults);
    console.log("Qualitative results:", qualitativeResults);

    let score = 0;

    quantitativeResults.forEach((item) => {
      if (item.response === "이행") score += parseFloat(item.score_fulfilled);
      else if (item.response === "미이행")
        score += parseFloat(item.score_unfulfilled);
      else if (item.response === "자문필요")
        score += parseFloat(item.score_consult);
      else if (item.response === "해당없음")
        score += parseFloat(item.score_not_applicable);
    });

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

const completeSelfTestService = async ({ systemId, userId }) => {
  if (!systemId || !userId) {
    throw new Error(
      "유효하지 않은 요청입니다. systemId와 userId를 확인하세요."
    );
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

    const [roundRow] = await connection.query(
      `SELECT MAX(diagnosis_round) AS max_round
       FROM assessment_result
       WHERE user_id = ? AND systems_id = ?`,
      [userId, systemId]
    );
    const nextDiagnosisRound = (roundRow[0].max_round || 0) + 1;

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
      throw new Error("자가진단 입력 데이터가 없습니다.");
    }

    const assessmentId = selfAssessmentResult[0].id;
    console.log("✅ [DEBUG] Retrieved assessment_id:", assessmentId);

    const { score, grade } = await calculateAssessmentScore(
      systemId,
      nextDiagnosisRound
    );
    console.log("✅ [DEBUG] 계산된 점수 및 등급:", { score, grade });

    const query = `
      INSERT INTO assessment_result (systems_id, user_id, assessment_id, score, feedback_status, completed_at, grade,  diagnosis_round)
      VALUES (?, ?, ?, ?, '전문가 자문이 반영되기전입니다', NOW(), ?, ?)
      ON DUPLICATE KEY UPDATE
      score = VALUES(score),
      feedback_status = VALUES(feedback_status),
      completed_at = VALUES(completed_at),
      grade = VALUES(grade);
    `;

    const values = [
      systemId,
      userId,
      assessmentId,
      score,
      grade,
      nextDiagnosisRound,
    ];
    console.log("📡 [DEBUG] 실행할 쿼리:", query, "params:", values);

    await connection.query(query, values);

    await connection.query(
      `UPDATE systems 
       SET assessment_status = '완료' 
       WHERE id = ? AND assessment_status != '완료'`,
      [systemId]
    );

    await connection.commit();
    console.log("✅ [DEBUG] 자가진단 결과가 성공적으로 저장됨");

    return {
      message: "자가진단 결과가 성공적으로 저장되었습니다.",
      score,
      grade,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ [ERROR] 자가진단 완료 실패:", error.message);
    throw new Error("서버 내부 오류 발생");
  } finally {
    if (connection) connection.release();
  }
};

const getAssessmentResultsService = async ({ userId, systemId }) => {
  if (!userId || !systemId) {
    throw new Error("필수 정보가 누락되었습니다.");
  }

  const query = `
    SELECT * FROM assessment_result
    WHERE user_id = ? AND systems_id = ?
    ORDER BY completed_at DESC
  `;

  const [results] = await pool.query(query, [userId, systemId]);

  if (results.length === 0) {
    throw new Error("진단 결과가 없습니다.");
  }

  return results;
};

const getAssessmentStatusesService = async () => {
  const query = `
    SELECT systems_id, COUNT(*) > 0 AS is_completed
    FROM assessment_result
    GROUP BY systems_id
  `;
  const [results] = await pool.query(query);

  const statusMap = results.reduce((acc, row) => {
    acc[row.systems_id] = row.is_completed;
    return acc;
  }, {});

  return statusMap;
};

const getDiagnosisRoundsService = async ({ userId, systemId }) => {
  if (!userId || !systemId) throw new Error("필수 정보 누락");

  const [rows] = await pool.query(
    `SELECT diagnosis_round, completed_at
     FROM assessment_result
     WHERE user_id = ? AND systems_id = ?
     ORDER BY diagnosis_round DESC`,
    [userId, systemId]
  );

  return rows;
};

const getResultByRoundService = async ({
  userId,
  systemId,
  diagnosisRound,
}) => {
  if (!userId || !systemId || !diagnosisRound)
    throw new Error("필수 정보 누락");

  const [rows] = await pool.query(
    `SELECT * FROM assessment_result
     WHERE user_id = ? AND systems_id = ? AND diagnosis_round = ?`,
    [userId, systemId, diagnosisRound]
  );

  if (rows.length === 0) throw new Error("해당 회차 결과 없음");

  return rows[0];
};

const getCategoryComparisonService = async (systemId, userId) => {
  // 먼저 해당 시스템에 대한 진단 데이터가 있는지 확인
  const checkDiagnosisQuery = `
    SELECT COUNT(*) as count
    FROM quantitative_responses
    WHERE systems_id = ? AND user_id = ?
  `;

  const [diagnosisCheck] = await pool.query(checkDiagnosisQuery, [
    systemId,
    userId,
  ]);

  // 자가진단 데이터가 없는 경우
  if (diagnosisCheck[0].count === 0) {
    return { hasDiagnosis: false };
  }

  // 자가진단 데이터가 있는 경우 카테고리별 비교 데이터 조회
  const query = `
    SELECT 
      c.id AS category_id,
      c.name AS category_name,
      SUM(
        CASE
          WHEN qr.response = '이행' THEN qq.score_fulfilled
          WHEN qr.response = '미이행' THEN qq.score_unfulfilled
          WHEN qr.response = '자문필요' THEN qq.score_consult
          WHEN qr.response = '해당없음' THEN qq.score_not_applicable
          ELSE 0
        END
      ) AS actual_score,
      SUM(qq.score_fulfilled) AS max_possible_score,
      ROUND(
        SUM(
          CASE
            WHEN qr.response = '이행' THEN qq.score_fulfilled
            WHEN qr.response = '미이행' THEN qq.score_unfulfilled
            WHEN qr.response = '자문필요' THEN qq.score_consult
            WHEN qr.response = '해당없음' THEN qq.score_not_applicable
            ELSE 0
          END
        ) / NULLIF(SUM(qq.score_fulfilled), 0) * 100, 
        2
      ) AS achievement_percentage
    FROM 
      categories c
    LEFT JOIN 
      quantitative_questions qq ON c.id = qq.category_id
    LEFT JOIN 
      quantitative_responses qr ON qq.id = qr.question_id 
        AND qr.systems_id = ?
        AND qr.user_id = ?
        AND qr.diagnosis_round = (
          SELECT MAX(diagnosis_round) 
          FROM quantitative_responses
          WHERE systems_id = ? AND user_id = ?
        )
    GROUP BY 
      c.id, c.name
    ORDER BY 
      achievement_percentage ASC;
  `;

  const [results] = await pool.query(query, [
    systemId,
    userId,
    systemId,
    userId,
  ]);

  return {
    hasDiagnosis: true,
    data: results,
  };
};

export {
  completeSelfTestService,
  getAssessmentResultsService,
  getAssessmentStatusesService,
  getDiagnosisRoundsService,
  getResultByRoundService,
  getCategoryComparisonService,
};
