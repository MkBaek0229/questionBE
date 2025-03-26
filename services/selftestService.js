import pool from "../config/db.js";

const handleSelfAssessmentSaveService = async (data, userId) => {
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
    diagnosisRound,
  } = data;

  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  if (!organization || !userGroup || !systemId) {
    throw new Error("필수 입력 항목이 누락되었습니다.");
  }

  const [systemExists] = await pool.query(
    "SELECT id FROM systems WHERE id = ?",
    [systemId]
  );

  if (systemExists.length === 0) {
    throw new Error(
      "유효하지 않은 systemId입니다. 시스템이 존재하지 않습니다."
    );
  }

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
    userId,
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

  return {
    message: "Self-assessment saved successfully.",
    diagnosisRound: diagnosisRound || 1,
  };
};

const submitQuantitativeResponsesService = async (data, userId) => {
  const { responses } = data;

  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  if (!responses || !Array.isArray(responses)) {
    throw new Error("Invalid responses format.");
  }

  const requiredFields = ["systemId", "questionId", "response"];
  let missingResponse = null;

  responses.forEach((res, index) => {
    const missingFields = requiredFields.filter(
      (field) => res[field] === undefined || res[field] === null
    );
    if (missingFields.length > 0 && !missingResponse) {
      missingResponse = res;
      console.error(`❌ 응답 ${index + 1}번 누락:`, missingFields);
    }
  });

  if (missingResponse) {
    throw new Error("필수 항목 누락");
  }

  for (const res of responses) {
    const [[question]] = await pool.query(
      "SELECT id FROM quantitative_questions WHERE question_number = ?",
      [res.questionId]
    );
    if (!question) continue;
    const query = `
  INSERT INTO quantitative_responses (
    systems_id, user_id, question_id, response, additional_comment, file_path, diagnosis_round
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    response = VALUES(response),
    additional_comment = VALUES(additional_comment),
    file_path = VALUES(file_path),
    diagnosis_round = VALUES(diagnosis_round);
`;

    await pool.query(query, [
      res.systemId,
      userId,
      question.id,
      res.response,
      res.additionalComment || "",
      res.filePath || null,
      res.diagnosisRound || 1, // ✅ 회차 포함 OK
    ]);
  }
  return { message: "정량 응답이 성공적으로 저장되었습니다." };
};

const submitQualitativeResponsesService = async (data) => {
  if (!data.responses || !Array.isArray(data.responses)) {
    throw new Error("응답 데이터가 유효하지 않습니다.");
  }

  const diagnosisRound = data.responses[0]?.diagnosisRound || 1;

  const values = data.responses.map((response) => [
    response.systemId,
    response.userId,
    response.questionId,
    response.response,
    response.additionalComment || null,
    response.filePath || null,
    diagnosisRound,
  ]);

  const query = `
    INSERT INTO qualitative_responses
    (systems_id, user_id, question_id, response, additional_comment, file_path, diagnosis_round)
    VALUES ?
    ON DUPLICATE KEY UPDATE
    response = VALUES(response),
    additional_comment = VALUES(additional_comment),
    file_path = VALUES(file_path),
    diagnosis_round = VALUES(diagnosis_round);
;

  `;

  await pool.query(query, [values]);

  return { message: "정성 평가 저장 완료" };
};

const getQuantitativeQuestionsService = async () => {
  const query = `SELECT * FROM quantitative_questions`;
  const [results] = await pool.query(query);
  return results;
};

const getQualitativeQuestionsService = async () => {
  const query = `SELECT * FROM qualitative_questions`;
  const [results] = await pool.query(query);
  return results;
};

const getQuantitativeResponsesService = async ({ systemId, userId }) => {
  const query = `
    SELECT 
      qq.question_number, 
      qq.question, 
      qq.evaluation_criteria, 
      qq.legal_basis, 
      COALESCE(qr.response, '-') AS response, 
      COALESCE(qr.additional_comment, '') AS additional_comment, 
      COALESCE(qr.file_path, '') AS file_path
    FROM quantitative_questions qq
    LEFT JOIN quantitative_responses qr 
      ON qq.id = qr.question_id 
      AND qr.systems_id = ? 
      AND qr.user_id = ?
      AND qr.diagnosis_round = ?

    ORDER BY qq.question_number;
  `;

  const [results] = await pool.query(query, [systemId, userId]);
  return results;
};

const getQualitativeResponsesService = async ({ systemId, userId }) => {
  const query = `
    SELECT 
      qq.question_number, 
      qq.indicator, 
      qq.indicator_definition, 
      qq.evaluation_criteria, 
      qq.reference_info,
      COALESCE(qr.response, '-') AS response, 
      COALESCE(qr.additional_comment, '') AS additional_comment, 
      COALESCE(qr.file_path, '') AS file_path
    FROM qualitative_questions qq
    LEFT JOIN qualitative_responses qr 
      ON qq.id = qr.question_id 
      AND qr.systems_id = ? 
      AND qr.user_id = ?
      AND qr.diagnosis_round = ?

    ORDER BY qq.question_number;
  `;

  const [results] = await pool.query(query, [systemId, userId]);
  return results;
};

const updateQuantitativeQuestionService = async (data) => {
  const { questionId, question, evaluationCriteria, legalBasis, category_id } =
    data;

  if (!questionId || !question || !evaluationCriteria || !category_id) {
    throw new Error("필수 입력 항목이 누락되었습니다.");
  }

  const query = `
    UPDATE quantitative_questions
    SET question = ?, evaluation_criteria = ?, legal_basis = ?, category_id = ?
    WHERE id = ?;
  `;

  const [result] = await pool.query(query, [
    question,
    evaluationCriteria,
    legalBasis || null,
    category_id,
    questionId,
  ]);

  if (result.affectedRows === 0) {
    throw new Error("해당 정량 문항을 찾을 수 없습니다.");
  }

  return { message: "정량 문항 업데이트 성공" };
};

const updateQualitativeQuestionService = async (data) => {
  const {
    questionId,
    indicator,
    indicatorDefinition,
    evaluationCriteria,
    referenceInfo,
  } = data;

  if (!questionId || !indicator || !evaluationCriteria) {
    throw new Error("필수 입력 항목이 누락되었습니다.");
  }

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
    throw new Error("해당 정성 문항을 찾을 수 없습니다.");
  }

  return { message: "정성 문항 업데이트 성공" };
};

const getNextDiagnosisRoundService = async (userId, systemsId) => {
  // 시스템 존재 여부 확인
  const [system] = await pool.query("SELECT id FROM systems WHERE id = ?", [
    systemsId,
  ]);
  if (system.length === 0) {
    throw new Error("해당 시스템이 존재하지 않습니다.");
  }

  const [rows] = await pool.query(
    `SELECT MAX(diagnosis_round) AS max_round
     FROM assessment_result
     WHERE user_id = ? AND systems_id = ?`,
    [userId, systemsId]
  );
  return (rows[0].max_round || 0) + 1;
};

export {
  handleSelfAssessmentSaveService,
  submitQuantitativeResponsesService,
  submitQualitativeResponsesService,
  getQuantitativeQuestionsService,
  getQualitativeQuestionsService,
  getQuantitativeResponsesService,
  getQualitativeResponsesService,
  updateQuantitativeQuestionService,
  updateQualitativeQuestionService,
  getNextDiagnosisRoundService,
};
