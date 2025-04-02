import pool from "../config/db.js";
import bcrypt from "bcryptjs";

const getAllUsersService = async () => {
  const query = `
    SELECT id, email, institution_name, institution_address, representative_name, phone_number, created_at
    FROM User;
  `;
  const [users] = await pool.query(query);
  return users;
};

const getUserByIdService = async (id) => {
  const query = `
    SELECT id, email, institution_name, institution_address, representative_name, phone_number, created_at
    FROM User
    WHERE id = ?;
  `;
  const [user] = await pool.query(query, [id]);
  if (user.length === 0) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  return user[0];
};

const deleteUserService = async (id) => {
  const query = `DELETE FROM User WHERE id = ?;`;
  const [result] = await pool.query(query, [id]);
  if (result.affectedRows === 0) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
};

const getAllExpertsService = async () => {
  const query = `
    SELECT id, name, institution_name, ofcps, phone_number, email, major_carrea
    FROM expert;
  `;
  const [experts] = await pool.query(query);
  return experts;
};

const getExpertByIdService = async (id) => {
  const query = `
    SELECT id, name, institution_name, ofcps, phone_number, email, major_carrea
    FROM expert
    WHERE id = ?;
  `;
  const [user] = await pool.query(query, [id]);
  if (user.length === 0) {
    throw new Error("전문가를 찾을 수 없습니다.");
  }
  return user[0];
};

const deleteExpertService = async (id) => {
  const query = `DELETE FROM expert WHERE id = ?;`;
  const [result] = await pool.query(query, [id]);
  if (result.affectedRows === 0) {
    throw new Error("전문가를 찾을 수 없습니다.");
  }
};

const getAllSystemsService = async () => {
  const query = `
    SELECT 
      s.id AS systems_id, 
      s.name AS system_name, 
      s.user_id,  
      COALESCE(u.institution_name, 'N/A') AS institution_name,  
      COALESCE(u.email, 'N/A') AS user_email
    FROM systems s
    LEFT JOIN User u ON s.user_id = u.id;  
  `;
  const [rows] = await pool.query(query);
  return rows;
};

const getMatchedExpertsService = async (systemId) => {
  const query = `
    SELECT e.id AS expert_id, e.name AS expert_name, e.institution_name, e.email
    FROM assignment a
    JOIN expert e ON a.expert_id = e.id
    WHERE a.systems_id = ?;
  `;
  const [rows] = await pool.query(query, [systemId]);
  return rows;
};

const loginSuperUserService = async ({ email, password }) => {
  const [rows] = await pool.query("SELECT * FROM superuser WHERE email = ?", [
    email,
  ]);
  if (!rows || rows.length === 0) {
    throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
  }

  const superuser = rows[0];

  if (password !== superuser.password) {
    throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
  }
  return {
    id: superuser.id,
    email: superuser.email,
    name: superuser.name,
    member_type: "superuser",
  };
};

const logoutSuperUserService = (req) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        return reject(new Error("세션 삭제 실패"));
      }
      resolve("세션 삭제 성공");
    });
  });
};

const getSystemByIdService = async (id) => {
  const query = `
    SELECT 
      systems.id AS systems_id,
      systems.name AS system_name,
      systems.purpose,
      systems.min_subjects,
      systems.max_subjects,
      systems.assessment_status,
      User.institution_name,
      User.representative_name
    FROM systems
    INNER JOIN User ON systems.user_id = User.id
    WHERE systems.id = ?;
  `;
  const [system] = await pool.query(query, [id]);
  if (system.length === 0) {
    throw new Error("시스템을 찾을 수 없습니다.");
  }
  return system[0];
};

const matchExpertsToSystemService = async (systemId, expertIds) => {
  // 문자열 -> 숫자 변환
  const numSystemId = Number(systemId);
  const numExpertIds = Array.isArray(expertIds)
    ? expertIds.map((id) => Number(id))
    : [Number(expertIds)];

  console.log("변환된 데이터:", { numSystemId, numExpertIds });

  if (isNaN(numSystemId)) {
    throw new Error("유효하지 않은 시스템 ID입니다");
  }

  if (numExpertIds.some((id) => isNaN(id))) {
    throw new Error("유효하지 않은 전문가 ID가 포함되어 있습니다");
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log("기존 매핑 삭제:", numSystemId);

    await connection.query("DELETE FROM assignment WHERE systems_id = ?", [
      numSystemId,
    ]);

    console.log("새 매핑 추가:", numExpertIds);

    for (const expertId of numExpertIds) {
      console.log(`- ${expertId} 매핑 중...`);
      // feedback_status 필드 값을 추가
      await connection.query(
        "INSERT INTO assignment (systems_id, expert_id, feedback_status) VALUES (?, ?, ?)",
        [numSystemId, expertId, "대기중"]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("매칭 오류 세부정보:", error);
    throw new Error(`전문가 매칭 중 오류가 발생했습니다: ${error.message}`);
  } finally {
    connection.release();
  }
};

const deleteSystemBySuperUserService = async (id) => {
  const query = `DELETE FROM systems WHERE id = ?;`;
  const [result] = await pool.query(query, [id]);
  if (result.affectedRows === 0) {
    throw new Error("시스템을 찾을 수 없습니다.");
  }
};

const SupergetQuantitativeQuestionsService = async () => {
  const query = `SELECT * FROM quantitative_questions;`;
  const [questions] = await pool.query(query);
  return questions;
};

const SupergetQualitativeQuestionsService = async () => {
  const query = `SELECT * FROM qualitative_questions;`;
  const [questions] = await pool.query(query);
  return questions;
};

const SupergetQuantitativeResponsesService = async (systemId) => {
  const query = `
    SELECT 
      qr.id AS response_id,
      qq.question_number,
      qq.question,
      qr.response,
      qr.additional_comment,
      qr.file_path
    FROM quantitative_responses qr
    JOIN quantitative_questions qq ON qr.question_id = qq.id
    WHERE qr.systems_id = ?;
  `;
  const [responses] = await pool.query(query, [systemId]);
  return responses;
};

const SupergetQualitativeResponsesService = async (systemId) => {
  const query = `
    SELECT 
      qr.id AS response_id,
      qq.question_number,
      qq.indicator,
      qr.response,
      qr.additional_comment,
      qr.file_path
    FROM qualitative_responses qr
    JOIN qualitative_questions qq ON qr.question_id = qq.id
    WHERE qr.systems_id = ?;
  `;
  const [responses] = await pool.query(query, [systemId]);
  return responses;
};

const addQuantitativeQuestionService = async (data) => {
  const {
    question,
    evaluation_criteria, // ← evaluationCriteria에서 변경
    legal_basis, // ← legalBasis에서 변경
    category_id,
    score_fulfilled, // 추가 점수 필드
    score_unfulfilled,
    score_consult,
    score_not_applicable,
    question_number,
  } = data;

  // 검증 로직 수정
  if (!question || !evaluation_criteria || !category_id) {
    throw new Error("필수 입력 항목이 누락되었습니다.");
  }

  // 쿼리에 추가 필드 포함
  const query = `
    INSERT INTO quantitative_questions (
      question, 
      evaluation_criteria, 
      legal_basis, 
      category_id,
      score_fulfilled,
      score_unfulfilled,
      score_consult,
      score_not_applicable,
      question_number
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const [result] = await pool.query(query, [
    question,
    evaluation_criteria,
    legal_basis || null,
    category_id,
    score_fulfilled || 100,
    score_unfulfilled || 0,
    score_consult || 0,
    score_not_applicable || 0,
    question_number || null,
  ]);

  return result;
};

const editQuantitativeQuestionService = async (id, data) => {
  // snake_case로 변경
  const {
    question,
    evaluation_criteria, // camelCase에서 snake_case로 변경
    legal_basis, // camelCase에서 snake_case로 변경
    category_id,
    score_fulfilled, // 추가: 점수 필드
    score_unfulfilled,
    score_consult,
    score_not_applicable,
  } = data;

  if (!question || !evaluation_criteria || !category_id) {
    throw new Error("필수 입력 항목이 누락되었습니다.");
  }

  // 점수 필드를 포함하도록 쿼리 확장
  const query = `
    UPDATE quantitative_questions
    SET question = ?, 
        evaluation_criteria = ?, 
        legal_basis = ?, 
        category_id = ?,
        score_fulfilled = ?,
        score_unfulfilled = ?,
        score_consult = ?,
        score_not_applicable = ?
    WHERE id = ?;
  `;

  const [result] = await pool.query(query, [
    question,
    evaluation_criteria,
    legal_basis || null,
    category_id,
    score_fulfilled || 100,
    score_unfulfilled || 0,
    score_consult || 0,
    score_not_applicable || 0,
    id,
  ]);

  if (result.affectedRows === 0) {
    throw new Error("해당 정량 문항을 찾을 수 없습니다.");
  }
};

const deleteQuantitativeQuestionService = async (id) => {
  const query = `DELETE FROM quantitative_questions WHERE id = ?;`;
  const [result] = await pool.query(query, [id]);
  if (result.affectedRows === 0) {
    throw new Error("해당 정량 문항을 찾을 수 없습니다.");
  }
};

const addQualitativeQuestionService = async (data) => {
  const {
    indicator,
    indicatorDefinition,
    evaluationCriteria,
    referenceInfo,
    category_id,
  } = data;

  if (!indicator || !evaluationCriteria || !category_id) {
    throw new Error("필수 입력 항목이 누락되었습니다.");
  }

  const query = `
    INSERT INTO qualitative_questions (indicator, indicator_definition, evaluation_criteria, reference_info, category_id)
    VALUES (?, ?, ?, ?, ?);
  `;

  const [result] = await pool.query(query, [
    indicator,
    indicatorDefinition || null,
    evaluationCriteria,
    referenceInfo || null,
    category_id,
  ]);

  return result;
};

const editQualitativeQuestionService = async (id, data) => {
  const {
    indicator,
    indicator_definition,
    evaluation_criteria,
    reference_info,
    category_id,
  } = data;

  if (!indicator || !evaluation_criteria || !category_id) {
    throw new Error("필수 입력 항목이 누락되었습니다.");
  }

  const query = `
    UPDATE qualitative_questions
    SET indicator = ?, indicator_definition = ?, evaluation_criteria = ?, reference_info = ?, category_id = ?
    WHERE id = ?;
  `;

  const [result] = await pool.query(query, [
    indicator,
    indicator_definition || null,
    evaluation_criteria,
    reference_info || null,
    category_id,
    id,
  ]);

  if (result.affectedRows === 0) {
    throw new Error("해당 정성 문항을 찾을 수 없습니다.");
  }
};

const deleteQualitativeQuestionService = async (id) => {
  const query = `DELETE FROM qualitative_questions WHERE id = ?;`;
  const [result] = await pool.query(query, [id]);
  if (result.affectedRows === 0) {
    throw new Error("해당 정성 문항을 찾을 수 없습니다.");
  }
};

const getCategoriesService = async () => {
  const query = `SELECT * FROM categories;`;
  const [categories] = await pool.query(query);
  return categories;
};

const addCategoryService = async (name) => {
  const query = `INSERT INTO categories (name) VALUES (?);`;
  const [result] = await pool.query(query, [name]);
  return result;
};

const updateCategoryService = async (categoryId, name) => {
  const query = `UPDATE categories SET name = ? WHERE id = ?;`;
  const [result] = await pool.query(query, [name, categoryId]);
  if (result.affectedRows === 0) {
    throw new Error("해당 카테고리를 찾을 수 없습니다.");
  }
};

const deleteCategoryService = async (categoryId) => {
  const query = `DELETE FROM categories WHERE id = ?;`;
  const [result] = await pool.query(query, [categoryId]);
  if (result.affectedRows === 0) {
    throw new Error("해당 카테고리를 찾을 수 없습니다.");
  }
};

const getSuperUserInfoService = async (superUserId) => {
  const query = `
    SELECT id, email, name, phone_number, created_at 
    FROM SuperUser
    WHERE id = ?;
  `;
  const [rows] = await pool.query(query, [superUserId]);
  if (rows.length === 0) {
    throw new Error("슈퍼유저 정보를 찾을 수 없습니다.");
  }
  return rows[0];
};

export {
  getAllUsersService,
  getUserByIdService,
  deleteUserService,
  getAllExpertsService,
  getExpertByIdService,
  deleteExpertService,
  getAllSystemsService,
  getMatchedExpertsService,
  loginSuperUserService,
  logoutSuperUserService,
  getSystemByIdService,
  matchExpertsToSystemService,
  deleteSystemBySuperUserService,
  SupergetQuantitativeQuestionsService,
  SupergetQualitativeQuestionsService,
  SupergetQuantitativeResponsesService,
  SupergetQualitativeResponsesService,
  addQuantitativeQuestionService,
  editQuantitativeQuestionService,
  deleteQuantitativeQuestionService,
  addQualitativeQuestionService,
  editQualitativeQuestionService,
  deleteQualitativeQuestionService,
  getCategoriesService,
  addCategoryService,
  updateCategoryService,
  deleteCategoryService,
  getSuperUserInfoService,
};
