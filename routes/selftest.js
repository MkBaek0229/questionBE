import express from "express";
import pool from "../db/connection.js"; // DB 연결 파일

const router = express.Router();

// Save Data Helper Function
const saveData = async (query, values) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(query, values);
    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

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

const handleQuantitativeSave = async (req, res) => {
  const { quantitativeResponses } = req.body;
  console.log("✅ [API] 정량 설문 저장 요청 데이터:", req.body);

  if (!quantitativeResponses || !Array.isArray(quantitativeResponses)) {
    return res
      .status(400)
      .json({ message: "Invalid quantitative responses format." });
  }

  const query = `
    INSERT INTO quantitative (
      question_number, question, response, additional_comment, system_id, user_id
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      response = VALUES(response),
      additional_comment = VALUES(additional_comment)
  `;

  try {
    for (const response of quantitativeResponses) {
      const {
        questionNumber,
        question = "", // 기본값 설정
        response: answer,
        additionalComment,
        systemId,
        userId,
      } = response;

      if (!questionNumber || !answer || !systemId || !userId) {
        console.error("Invalid response:", response);
        return res.status(400).json({
          message: "Missing required fields in quantitative response.",
        });
      }

      const values = [
        questionNumber,
        question,
        answer,
        additionalComment || null,
        systemId,
        userId,
      ];

      console.log("Saving quantitative response:", values);
      await pool.query(query, values);
    }

    res
      .status(200)
      .json({ message: "정량 평가 데이터가 성공적으로 저장되었습니다." });
  } catch (error) {
    console.error("Error saving quantitative data:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// Save Qualitative Data
const handleQualitativeSave = async (req, res) => {
  const {
    questionNumber,
    response,
    additionalComment,
    systemId,
    userId,
    indicator,
  } = req.body;

  if (!questionNumber || !systemId || !userId || !indicator) {
    return res.status(400).json({ message: "필수 필드가 누락되었습니다." });
  }

  const query = `
    INSERT INTO qualitative (
      question_number, indicator, response, additional_comment, system_id, user_id
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      response = VALUES(response),
      additional_comment = VALUES(additional_comment)
  `;

  const values = [
    questionNumber,
    indicator,
    response || "해당없음",
    additionalComment || null,
    systemId,
    userId,
  ];

  try {
    await pool.query(query, values);
    res
      .status(200)
      .json({ message: "정성 설문 데이터가 성공적으로 저장되었습니다." });
  } catch (error) {
    console.error("❌ 정성 설문 저장 실패:", error.message);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};
// Get Quantitative Data
const getQuantitativeData = async (req, res) => {
  const { systemId } = req.query;

  if (!systemId) {
    return res.status(400).json({ message: "System ID is required." });
  }

  const query = `
    SELECT question_number, unit, question, legal_basis, evaluation_criteria,
           reference_info, response, additional_comment, file_upload
    FROM quantitative
    WHERE system_id = ?
  `;

  try {
    const [results] = await pool.query(query, [systemId]);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching quantitative data:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// Get Qualitative Data
const getQualitativeData = async (req, res) => {
  const { systemId } = req.query;

  if (!systemId) {
    console.error("🚨 systemId가 전달되지 않음");
    return res.status(400).json({ message: "System ID is required." });
  }

  console.log("📌 [DB 조회] 정성 문항 데이터 요청, systemId:", systemId);

  const query = `
  SELECT question_number, indicator, indicator_definition, evaluation_criteria,
         reference_info, response, additional_comment
  FROM qualitative
  WHERE system_id = ?
`;

  try {
    const [results] = await pool.query(query, [systemId]);

    if (results.length === 0) {
      console.warn(
        "⚠️ 해당 systemId에 대한 정성 평가 데이터가 없음:",
        systemId
      );
      return res.status(200).json([]); // ❗ 데이터가 없으면 빈 배열 반환
    }

    console.log(
      "✅ [DB 응답] 정성 문항 데이터 조회 성공:",
      results.length,
      "개"
    );
    res.status(200).json(results);
  } catch (error) {
    console.error(
      "❌ 정성 문항 데이터를 불러오는 중 오류 발생:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export {
  handleSelfAssessmentSave,
  handleQuantitativeSave,
  handleQualitativeSave,
  getQuantitativeData,
  getQualitativeData,
};
