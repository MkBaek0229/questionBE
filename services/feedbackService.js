import pool from "../config/db.js";

const getAssignedSystemsService = async ({ expertId }) => {
  if (!expertId) {
    throw new Error("전문가 ID가 필요합니다.");
  }

  const query = `
    SELECT 
      s.id AS systems_id, 
      s.name AS system_name, 
      u.institution_name, 
      ar.score, 
      ar.grade, 
      ar.feedback_status
    FROM assignment a
    JOIN systems s ON a.systems_id = s.id
    JOIN User u ON s.user_id = u.id
    LEFT JOIN assessment_result ar ON s.id = ar.systems_id 
      AND ar.completed_at = (
        SELECT MAX(completed_at) FROM assessment_result WHERE systems_id = s.id
      )
    WHERE a.expert_id = ?;
  `;

  const [results] = await pool.query(query, [expertId]);
  return results;
};

const submitQuantitativeFeedbackService = async ({
  systemId,
  expertId,
  feedbackResponses,
}) => {
  if (!systemId || !expertId || !Array.isArray(feedbackResponses)) {
    throw new Error("잘못된 요청 형식입니다.");
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const { questionNumber, feedback } of feedbackResponses) {
      if (!questionNumber) {
        console.warn("⚠️ [정량] 잘못된 questionNumber:", questionNumber);
        continue;
      }

      const [questionResult] = await connection.query(
        `SELECT id FROM quantitative_questions WHERE question_number = ?`,
        [questionNumber]
      );

      if (questionResult.length === 0) {
        console.warn(`⚠️ [정량] ${questionNumber}번 문항이 존재하지 않습니다.`);
        continue;
      }

      const { id: questionId } = questionResult[0];

      const [responseResult] = await connection.query(
        `SELECT id, user_id 
         FROM quantitative_responses 
         WHERE systems_id = ? AND question_id = ? 
         ORDER BY updated_at DESC LIMIT 1`,
        [systemId, questionId]
      );

      let quantitativeResponseId, user_id;
      if (responseResult.length === 0) {
        const [insertResult] = await connection.query(
          `INSERT INTO quantitative_responses 
           (systems_id, user_id, question_id, response) 
           VALUES (?, ?, ?, ?)`,
          [systemId, expertId, questionId, "이행"]
        );
        quantitativeResponseId = insertResult.insertId;
        user_id = expertId;
      } else {
        quantitativeResponseId = responseResult[0].id;
        user_id = responseResult[0].user_id;
      }

      await connection.query(
        `INSERT INTO feedback 
         (systems_id, user_id, expert_id, quantitative_response_id, feedback)
         VALUES (?, ?, ?, ?, ?)`,
        [systemId, user_id, expertId, quantitativeResponseId, feedback]
      );

      console.log(`✅ [정량] ${questionNumber}번 피드백 저장 완료`);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw new Error("정량 피드백 저장 실패: " + error.message);
  } finally {
    connection.release();
  }
};

const submitQualitativeFeedbackService = async ({
  systemId,
  expertId,
  feedbackResponses,
}) => {
  if (!systemId || !expertId || !Array.isArray(feedbackResponses)) {
    throw new Error("잘못된 요청 형식입니다.");
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const { questionNumber, feedback } of feedbackResponses) {
      if (!questionNumber) {
        console.warn("⚠️ [정성] 잘못된 questionNumber:", questionNumber);
        continue;
      }

      const [questionResult] = await connection.query(
        `SELECT id FROM qualitative_questions WHERE question_number = ?`,
        [questionNumber]
      );

      if (questionResult.length === 0) {
        console.warn(`⚠️ [정성] ${questionNumber}번 문항이 존재하지 않습니다.`);
        continue;
      }

      const { id: questionId } = questionResult[0];

      const [responseResult] = await connection.query(
        `SELECT id, user_id FROM qualitative_responses 
         WHERE systems_id = ? AND question_id = ? 
         ORDER BY updated_at DESC LIMIT 1`,
        [systemId, questionId]
      );

      let qualitativeResponseId, user_id;
      if (responseResult.length === 0) {
        const [insertResult] = await connection.query(
          `INSERT INTO qualitative_responses 
           (systems_id, user_id, question_id, response) 
           VALUES (?, ?, ?, ?)`,
          [systemId, expertId, questionId, "해당없음"]
        );
        qualitativeResponseId = insertResult.insertId;
        user_id = expertId;
      } else {
        qualitativeResponseId = responseResult[0].id;
        user_id = responseResult[0].user_id;
      }

      await connection.query(
        `INSERT INTO feedback 
         (systems_id, user_id, expert_id, qualitative_response_id, feedback)
         VALUES (?, ?, ?, ?, ?)`,
        [systemId, user_id, expertId, qualitativeResponseId, feedback]
      );

      console.log(`✅ [정성] ${questionNumber}번 피드백 저장 완료`);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw new Error("정성 피드백 저장 실패: " + error.message);
  } finally {
    connection.release();
  }
};

const getFeedbacksService = async ({ systemId, questionNumber }) => {
  if (!systemId) {
    throw new Error("System ID가 필요합니다.");
  }

  let query = `
  SELECT 
    f.id AS feedback_id, 
    f.feedback, 
    f.created_at, 
    COALESCE(qq.question_number, qlq.question_number) AS question_number,
    e.name AS expert_name,
    CASE 
      WHEN qr.id IS NOT NULL THEN '정량'
      WHEN qlr.id IS NOT NULL THEN '정성'
      ELSE '알 수 없음'
    END AS feedback_type
  FROM feedback f
  JOIN expert e ON f.expert_id = e.id
  LEFT JOIN quantitative_responses qr ON f.quantitative_response_id = qr.id
  LEFT JOIN quantitative_questions qq ON qr.question_id = qq.id
  LEFT JOIN qualitative_responses qlr ON f.qualitative_response_id = qlr.id
  LEFT JOIN qualitative_questions qlq ON qlr.question_id = qlq.id
  WHERE f.systems_id = ?
`;

  const queryParams = [systemId];

  if (questionNumber) {
    query += ` AND COALESCE(qq.question_number, qlq.question_number) = ?`;
    queryParams.push(questionNumber);
  }

  query += ` ORDER BY f.created_at DESC;`;

  const [results] = await pool.query(query, queryParams);
  return results;
};

const updateFeedbackStatusService = async ({ systemId }) => {
  if (!systemId) {
    throw new Error("시스템 ID가 필요합니다.");
  }

  const query = `
    UPDATE assessment_result
    SET feedback_status = '전문가 자문이 반영되었습니다'
    WHERE systems_id = ?;
  `;

  const [result] = await pool.query(query, [systemId]);

  if (result.affectedRows === 0) {
    throw new Error("해당 시스템 ID에 대한 결과를 찾을 수 없습니다.");
  }
};

const getSystemAssessmentResultService = async ({ systemId }) => {
  if (!systemId) {
    throw new Error("시스템 ID가 필요합니다.");
  }

  const query = `
    SELECT ar.id AS assessment_id, ar.systems_id, ar.user_id, ar.score, 
           ar.grade, ar.feedback_status, ar.completed_at, u.institution_name
    FROM assessment_result ar
    JOIN systems s ON ar.systems_id = s.id
    JOIN User u ON s.user_id = u.id
    WHERE ar.systems_id = ?;
  `;

  const [results] = await pool.query(query, [systemId]);

  if (results.length === 0) {
    throw new Error("자가진단 결과를 찾을 수 없습니다.");
  }

  return results[0];
};

const SystemsResultService = async ({ userId }) => {
  if (!userId) {
    throw new Error("기관회원 ID가 필요합니다.");
  }

  const query = `
    SELECT s.id AS systems_id, s.name AS system_name, 
           ar.score, ar.grade, ar.feedback_status, ar.completed_at,
           f.feedback_content, e.name AS expert_name
    FROM systems s
    LEFT JOIN assessment_result ar ON s.id = ar.systems_id
    LEFT JOIN assignment a ON s.id = a.systems_id
    LEFT JOIN feedback f ON ar.id = f.assessment_result_id
    LEFT JOIN expert e ON a.expert_id = e.id
    WHERE s.user_id = ?;
  `;

  const [results] = await pool.query(query, [userId]);
  return results;
};

const getSystemOwnerService = async ({ systemId }) => {
  if (!systemId) {
    throw new Error("systemId가 필요합니다.");
  }

  const query = "SELECT user_id FROM systems WHERE id = ?";
  const [result] = await pool.query(query, [systemId]);

  if (result.length === 0) {
    throw new Error("해당 시스템을 찾을 수 없습니다.");
  }

  return result[0];
};

export {
  getAssignedSystemsService,
  submitQuantitativeFeedbackService,
  submitQualitativeFeedbackService,
  getFeedbacksService,
  updateFeedbackStatusService,
  getSystemAssessmentResultService,
  SystemsResultService,
  getSystemOwnerService,
};
