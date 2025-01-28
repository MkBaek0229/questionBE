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
    const query = `
      INSERT INTO self_assessment (
        user_id, system_id, organization, user_scale, personal_info_system,
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
    console.error("Self-assessment 저장 실패:", err.message);
    res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

// 정량 데이터 저장
const saveQuantitativeResponses = async (req, res) => {
  const { responses } = req.body;

  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ message: "Invalid responses format." });
  }

  const user_id = req.session.user?.id;
  if (!user_id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const query = `
      INSERT INTO quantitative_responses (system_id, user_id, question_id, response, additional_comment, file_path)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        response = VALUES(response), 
        additional_comment = CASE 
          WHEN VALUES(response) = '자문 필요' THEN VALUES(additional_comment) 
          ELSE NULL 
        END,
        file_path = VALUES(file_path);
    `;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const {
      systemId,
      questionId,
      response,
      additionalComment,
      filePath,
    } of responses) {
      // "자문 필요"가 아닐 경우 additionalComment를 null로 설정
      const safeAdditionalComment =
        response === "자문 필요" ? additionalComment || "자문 요청" : null;

      await connection.query(query, [
        systemId,
        user_id,
        questionId,
        response,
        safeAdditionalComment,
        filePath || null,
      ]);
    }

    await connection.commit();
    connection.release();

    res.status(200).json({ message: "응답 저장 완료" });
  } catch (error) {
    console.error("응답 저장 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

// 정량 데이터 조회
const getQuantitativeQuestions = async (req, res) => {
  try {
    const query = `SELECT * FROM quantitative_questions`;
    const [results] = await pool.query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error("정량 문항 조회 실패:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

// 정성 데이터 조회
const getQualitativeQuestions = async (req, res) => {
  try {
    const query = `SELECT * FROM qualitative_questions`;
    const [results] = await pool.query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error("정성 문항 조회 실패:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

// 정성 데이터 저장
const saveQualitativeResponses = async (req, res) => {
  const { responses } = req.body;
  const user_id = req.session.user?.id;

  if (!user_id) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ message: "Invalid responses format." });
  }

  try {
    const query = `
      INSERT INTO qualitative_responses (system_id, user_id, question_id, response, additional_comment, file_path)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        response = VALUES(response), 
        additional_comment = CASE 
          WHEN VALUES(response) = '자문 필요' THEN VALUES(additional_comment) 
          ELSE NULL 
        END,
        file_path = VALUES(file_path);
    `;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const {
      systemId,
      questionId,
      response,
      additionalComment,
      filePath,
    } of responses) {
      // ✅ ENUM 값 검증
      if (!["자문 필요", "해당없음"].includes(response)) {
        throw new Error(`Invalid response value: ${response}`);
      }

      // ✅ "자문 필요"일 경우 `additional_comment` 기본값 설정
      const safeAdditionalComment =
        response === "자문 필요"
          ? additionalComment?.trim() || "자문 요청"
          : null;

      await connection.query(query, [
        systemId,
        user_id,
        questionId,
        response,
        safeAdditionalComment,
        filePath || null, // ✅ 파일 첨부 필드 유지
      ]);
    }

    await connection.commit();
    connection.release();

    res.status(200).json({ message: "정성 응답 저장 완료" });
  } catch (error) {
    console.error("정성 응답 저장 실패:", error.message);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

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
      SELECT qq.question_number, qq.question, qq.evaluation_criteria, qq.legal_basis, qq.score,
             qr.response, qr.additional_comment, qr.file_path, qr.feedback
      FROM quantitative_responses qr
      JOIN quantitative_questions qq ON qr.question_id = qq.id
      WHERE qr.system_id = ? AND qr.user_id = ?;
    `;
    const [results] = await pool.query(query, [systemId, userId]);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching quantitative responses:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};
// 정성 응답 조회
const getQualitativeResponses = async (req, res) => {
  const { systemId, userId } = req.query;

  if (!systemId || !userId) {
    return res
      .status(400)
      .json({ message: "System ID and User ID are required." });
  }

  try {
    const query = `
      SELECT qq.question_number, qq.indicator, qq.indicator_definition, qq.evaluation_criteria, qq.reference_info,
             qr.response, qr.additional_comment, qr.file_path, qr.feedback
      FROM qualitative_responses qr
      JOIN qualitative_questions qq ON qr.question_id = qq.id
      WHERE qr.system_id = ? AND qr.user_id = ?;
    `;
    const [results] = await pool.query(query, [systemId, userId]);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching qualitative responses:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export {
  handleSelfAssessmentSave,
  saveQuantitativeResponses,
  saveQualitativeResponses,
  getQuantitativeQuestions,
  getQualitativeQuestions,
  getQuantitativeResponses,
  getQualitativeResponses,
};
