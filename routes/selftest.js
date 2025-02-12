import express from "express";
import pool from "../db/connection.js"; // DB 연결 파일

const router = express.Router();

// Self-assessment 저장
const handleSelfAssessmentSave = async (req, res) => {
  const {
    organization,
    userGroup,
    personalInfoSystem,
    memberInfoHomepage,
    externalDataProvision = "없음",
    cctvOperation,
    taskOutsourcing,
    personalInfoDisposal,
    systemId,
  } = req.body;

  const user_id = req.session.user?.id;
  if (!user_id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  if (!organization || !userGroup || !systemId) {
    return res
      .status(400)
      .json({ message: "필수 입력 항목이 누락되었습니다." });
  }

  try {
    // ✅ 시스템 존재 여부 확인
    const [systemExists] = await pool.query(
      "SELECT id FROM systems WHERE id = ?",
      [systemId]
    );

    console.log("🔍 [DB 조회] 시스템 존재 여부:", systemExists);
    if (systemExists.length === 0) {
      return res.status(400).json({
        message: "유효하지 않은 systemId입니다. 시스템이 존재하지 않습니다.",
      });
    }

    // ✅ self_assessment 저장 또는 업데이트
    const query = `
      INSERT INTO self_assessment (
        user_id, systems_id, organization, user_scale, personal_info_system,
        member_info_homepage, external_data_provision, cctv_operation,
        task_outsourcing, personal_info_disposal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        organization = VALUES(organization),
        user_scale = VALUES(user_scale),
        personal_info_system = VALUES(personal_info_system),
        member_info_homepage = VALUES(member_info_homepage),
        external_data_provision = VALUES(external_data_provision),
        cctv_operation = VALUES(cctv_operation),
        task_outsourcing = VALUES(task_outsourcing),
        personal_info_disposal = VALUES(personal_info_disposal)
    `;

    const values = [
      user_id,
      systemId,
      organization,
      userGroup,
      personalInfoSystem,
      memberInfoHomepage,
      externalDataProvision,
      cctvOperation,
      taskOutsourcing,
      personalInfoDisposal,
    ];

    await pool.query(query, values);
    res.status(201).json({ message: "Self-assessment saved successfully." });
  } catch (err) {
    console.error("❌ Self-assessment 저장 실패:", err);
    res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

// 정량 데이터 저장
// 정량 응답 제출
const submitQuantitativeResponses = async (req, res) => {
  const { responses } = req.body;
  const user_id = req.session.user?.id;

  if (!user_id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ message: "Invalid responses format." });
  }

  let connection;

  try {
    console.log("📡 [DEBUG] 수신된 정량 응답 데이터:", responses);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO quantitative_responses (systems_id, user_id, question_id, response, additional_comment, file_path)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        response = VALUES(response), 
        additional_comment = VALUES(additional_comment), 
        file_path = VALUES(file_path),
        updated_at = CURRENT_TIMESTAMP;
    `;

    const checkQuestionQuery = `SELECT COUNT(*) AS count FROM quantitative_questions WHERE id = ?`;

    for (const {
      systemId,
      questionId,
      response,
      additionalComment,
      filePath,
    } of responses) {
      // 🚨 `questionId`가 0이거나 잘못된 경우 에러 처리
      if (!questionId || questionId <= 0) {
        console.error(`❌ [ERROR] Invalid questionId received: ${questionId}`);
        return res
          .status(400)
          .json({ message: `Invalid questionId: ${questionId}` });
      }

      if (!systemId) {
        console.error(`❌ [ERROR] Invalid systemId received: ${systemId}`);
        return res
          .status(400)
          .json({ message: `Invalid systemId: ${systemId}` });
      }

      // 🔍 `questionId`가 `quantitative_questions` 테이블에 존재하는지 확인
      const [questionExists] = await connection.query(checkQuestionQuery, [
        questionId,
      ]);
      if (questionExists[0].count === 0) {
        console.error(
          `❌ [ERROR] Question not found for questionId: ${questionId}`
        );
        return res.status(400).json({
          message: `Question not found for questionId: ${questionId}`,
        });
      }

      // 🚀 `response` 값이 ENUM 값과 일치하는지 확인
      const validResponses = ["이행", "미이행", "해당없음", "자문필요"];
      const normalizedResponse =
        response && validResponses.includes(response.trim())
          ? response.trim()
          : "이행";

      // ✅ `additionalComment`는 `자문필요`일 때만 저장, 그 외에는 `NULL`
      const safeAdditionalComment =
        normalizedResponse === "자문필요"
          ? additionalComment?.trim() || "자문 요청"
          : null;

      console.log(
        `📡 [DEBUG] 저장할 데이터 → systemId: ${systemId}, userId: ${user_id}, questionId: ${questionId}, response: ${normalizedResponse}, additionalComment: ${safeAdditionalComment}, filePath: ${filePath}`
      );

      await connection.query(insertQuery, [
        systemId,
        user_id,
        questionId,
        normalizedResponse,
        safeAdditionalComment,
        filePath || null,
      ]);
    }

    await connection.commit();
    console.log("✅ [SUCCESS] 모든 정량 응답 저장 완료");

    res.status(200).json({ message: "정량 응답 저장 완료" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ [ERROR] 정량 응답 저장 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// 정량 데이터 조회
const getQuantitativeQuestions = async (req, res) => {
  try {
    const query = `SELECT * FROM quantitative_questions`;
    const [results] = await pool.query(query);
    console.log("정량 문항 조회 성공:", results);
    res.status(200).json(results);
  } catch (error) {
    console.error("정량 문항 조회 실패:", error.stack);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

// 정성 데이터 조회 (특정 시스템 ID 기준)
const getQualitativeQuestions = async (req, res) => {
  try {
    console.log("📡 [DEBUG] GET /selftest/qualitative 요청 수신");

    // SQL 실행 전 디버깅
    const query = `SELECT * FROM qualitative_questions`;
    console.log("📡 [DEBUG] 실행할 SQL 쿼리:", query);

    const [results] = await pool.query(query);

    if (results.length === 0) {
      console.warn("⚠️ 정성 문항 데이터가 없습니다.");
      return res.status(404).json({ message: "정성 문항이 없습니다." });
    }

    console.log("✅ [DEBUG] 조회된 데이터:", results);
    res.status(200).json(results);
  } catch (error) {
    console.error("❌ [ERROR] 정성 문항 조회 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

const submitQualitativeResponses = async (req, res) => {
  const { responses } = req.body;
  const user_id = req.session.user?.id;

  if (!user_id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ message: "Invalid responses format." });
  }

  try {
    console.log("📡 [DEBUG] Received qualitative responses:", responses);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const {
      systemId,
      questionId,
      response,
      additionalComment,
      filePath,
    } of responses) {
      const parsedQuestionId = Number(questionId);

      // ✅ [DEBUG] questionId 값 확인
      if (!parsedQuestionId || parsedQuestionId === 0) {
        console.error(`❌ [ERROR] Invalid questionId received: ${questionId}`);
        await connection.release();
        return res.status(400).json({ message: "Invalid questionId detected" });
      }

      console.log(
        `🟢 [DEBUG] Saving response → questionId: ${parsedQuestionId}, response: ${response}`
      );

      await connection.query(
        `INSERT INTO qualitative_responses (systems_id, user_id, question_id, response, additional_comment, file_path)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           response = VALUES(response),
           additional_comment = CASE WHEN VALUES(response) = '자문필요' THEN VALUES(additional_comment) ELSE NULL END,
           file_path = VALUES(file_path);`,
        [
          systemId,
          user_id,
          parsedQuestionId, // ✅ 변환된 값 사용
          response,
          additionalComment,
          filePath || null,
        ]
      );

      console.log(
        `✅ [SUCCESS] Saved qualitative response → questionId: ${parsedQuestionId}`
      );
    }

    await connection.commit();
    res.status(200).json({ message: "정성 응답 저장 완료" });
  } catch (error) {
    console.error("❌ [ERROR] 정성 응답 저장 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

// 정량 응답 조회
// 정량 응답 조회
const getQuantitativeResponses = async (req, res) => {
  const { systemId, userId } = req.query;

  if (!systemId || !userId) {
    return res
      .status(400)
      .json({ message: "System ID and User ID are required." });
  }

  try {
    const query = `
      SELECT 
        qq.question_number, 
        qq.question, 
        qq.evaluation_criteria, 
        qq.legal_basis, 
        qq.score,
        COALESCE(qr.response, '-') AS response,  -- 🚀 NULL 방지
        COALESCE(qr.additional_comment, '') AS additional_comment, 
        COALESCE(qr.file_path, '') AS file_path
      FROM quantitative_responses qr
      JOIN quantitative_questions qq ON qr.question_id = qq.id
      WHERE qr.systems_id = ? AND qr.user_id = ?;
    `;

    const [results] = await pool.query(query, [systemId, userId]);

    console.log("📡 [DEBUG] 정량 응답 조회 결과:", results);

    res.status(200).json(results);
  } catch (error) {
    console.error("❌ [ERROR] 정량 응답 조회 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

const getQualitativeResponses = async (req, res) => {
  const { systemId, userId } = req.query;

  if (!systemId || !userId) {
    return res
      .status(400)
      .json({ message: "System ID and User ID are required." });
  }

  try {
    const query = `
      SELECT 
        qq.question_number, 
        qq.indicator, 
        qq.indicator_definition, 
        qq.evaluation_criteria, 
        qq.reference_info,
        qr.response, 
        qr.additional_comment, 
        qr.file_path
      FROM qualitative_responses qr
      JOIN qualitative_questions qq ON qr.question_id = qq.id
      WHERE qr.systems_id = ? AND qr.user_id = ?;
    `;
    const [results] = await pool.query(query, [systemId, userId]);

    console.log("📡 [DEBUG] 정성 응답 조회 결과:", results);

    if (results.length === 0) {
      console.warn("⚠️ [WARNING] 정성 응답이 존재하지 않습니다.");
      return res.status(404).json({ message: "정성 응답이 없습니다." });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("❌ [ERROR] 정성 응답 조회 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

const updateQuantitativeQuestion = async (req, res) => {
  const { questionId, question, evaluationCriteria, legalBasis, score } =
    req.body;

  if (!questionId || !question || !evaluationCriteria || !score) {
    return res
      .status(400)
      .json({ message: "필수 입력 항목이 누락되었습니다." });
  }

  try {
    const query = `
      UPDATE quantitative_questions
      SET question = ?, evaluation_criteria = ?, legal_basis = ?, score = ?
      WHERE id = ?;
    `;

    const [result] = await pool.query(query, [
      question,
      evaluationCriteria,
      legalBasis || null,
      score,
      questionId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "해당 정량 문항을 찾을 수 없습니다.",
      });
    }

    res.status(200).json({ message: "정량 문항 업데이트 성공" });
  } catch (error) {
    console.error("❌ [ERROR] 정량 문항 업데이트 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};
/**
 * ✅ 정성 문항 업데이트
 */
const updateQualitativeQuestion = async (req, res) => {
  const {
    questionId,
    indicator,
    indicatorDefinition,
    evaluationCriteria,
    referenceInfo,
  } = req.body;

  if (!questionId || !indicator || !evaluationCriteria) {
    return res
      .status(400)
      .json({ message: "필수 입력 항목이 누락되었습니다." });
  }

  try {
    const query = `
      UPDATE qualitative_questions
      SET indicator = ?, indicator_definition = ?, evaluation_criteria = ?, reference_info = ?
      WHERE id = ?;
    `;

    const [result] = await pool.query(query, [
      indicator,
      indicatorDefinition || null,
      evaluationCriteria,
      referenceInfo || null,
      questionId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "해당 정성 문항을 찾을 수 없습니다.",
      });
    }

    res.status(200).json({ message: "정성 문항 업데이트 성공" });
  } catch (error) {
    console.error("❌ [ERROR] 정성 문항 업데이트 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};
export {
  handleSelfAssessmentSave,
  submitQuantitativeResponses,
  submitQualitativeResponses,
  getQuantitativeQuestions,
  getQualitativeQuestions,
  getQuantitativeResponses,
  getQualitativeResponses,
  updateQuantitativeQuestion,
  updateQualitativeQuestion,
};
