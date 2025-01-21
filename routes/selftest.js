import express from "express";
import pool from "../db/connection.js"; // DB 연결 파일

const router = express.Router();

// Get Existing Self-Assessment Data
const getSelfAssessmentData = async (req, res) => {
  const { systemId, userId } = req.query;

  console.log(
    "📌 [GET] 자가진단 데이터 요청 - systemId:",
    systemId,
    "userId:",
    userId
  );

  if (!systemId || !userId) {
    return res
      .status(400)
      .json({ message: "System ID와 User ID가 필요합니다." });
  }

  try {
    const [results] = await pool.query(
      "SELECT * FROM self_assessment WHERE system_id = ? AND user_id = ?",
      [systemId, userId]
    );

    if (results.length === 0) {
      console.warn(
        "⚠️ 해당 systemId와 userId에 대한 자가진단 데이터가 없음:",
        systemId,
        userId
      );
      return res.status(404).json({ message: "자가진단 데이터가 없습니다." });
    }

    console.log("✅ [응답] 자가진단 데이터 조회 성공:", results);
    res.status(200).json(results[0]); // 데이터가 있으면 첫 번째 항목 반환
  } catch (error) {
    console.error(
      "❌ [ERROR] 자가진단 데이터를 불러오는 중 오류 발생:",
      error.message
    );
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

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

  // 필수 데이터 검증
  if (!quantitativeResponses || !Array.isArray(quantitativeResponses)) {
    return res
      .status(400)
      .json({ message: "Invalid quantitative responses format." });
  }

  const query = `
    INSERT INTO quantitative (
      question_number, question, response, additional_comment, system_id
    ) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      question = VALUES(question),
      response = VALUES(response),
      additional_comment = VALUES(additional_comment)
  `;

  try {
    for (const response of quantitativeResponses) {
      const {
        questionNumber,
        question, // 추가된 필드
        response: answer,
        additionalComment,
        systemId,
      } = response;

      // 필수 필드 검증
      if (!questionNumber || !answer || !systemId || !question) {
        console.error("Invalid response:", response);
        return res.status(400).json({
          message: "Missing required fields in quantitative response.",
        });
      }

      const values = [
        questionNumber,
        question, // 추가된 필드
        answer,
        additionalComment || null,
        systemId,
      ];

      console.log("Saving quantitative response:", values);
      await saveData(query, values);
    }

    res.status(200).json({ message: "Quantitative data saved successfully." });
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
    indicator, // ✅ question 대신 indicator 사용
  } = req.body;

  // 필수 필드 확인
  if (!questionNumber || !systemId || !userId || !indicator) {
    return res.status(400).json({ message: "필수 필드가 누락되었습니다." });
  }

  const query = `
    INSERT INTO qualitative (
      question_number, indicator, response, additional_comment, system_id, user_id
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      indicator = VALUES(indicator),
      response = VALUES(response),
      additional_comment = VALUES(additional_comment)
  `;

  const values = [
    questionNumber,
    indicator, // ✅ question 대신 indicator 사용
    response || "해당없음",
    additionalComment || null,
    systemId,
    userId,
  ];

  try {
    await pool.query(query, values);
    res.status(200).json({ message: "정성 설문 저장 성공." });
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
  getSelfAssessmentData,
};
