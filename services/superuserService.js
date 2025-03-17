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

const loginSuperUserService = async (email, password, req) => {
  const [rows] = await pool.query("SELECT * FROM superuser WHERE email = ?", [
    email,
  ]);
  if (rows.length === 0) {
    throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
  }

  req.session.superuser = user;
  return { id: user.id, email: user.email, name: user.name };
};

const logoutSuperUserService = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ resultCode: "F-1", msg: "로그아웃 실패" });
    }

    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    res.status(200).json({ resultCode: "S-1", msg: "로그아웃 성공" });
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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query("DELETE FROM assignment WHERE systems_id = ?", [
      systemId,
    ]);

    for (const expertId of expertIds) {
      await connection.query(
        "INSERT INTO assignment (systems_id, expert_id) VALUES (?, ?)",
        [systemId, expertId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw new Error("전문가 매칭 중 오류가 발생했습니다.");
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
  const { question, evaluationCriteria, legalBasis, category_id } = data;

  if (!question || !evaluationCriteria || !category_id) {
    throw new Error("필수 입력 항목이 누락되었습니다.");
  }

  const query = `
    INSERT INTO quantitative_questions (question, evaluation_criteria, legal_basis, category_id)
    VALUES (?, ?, ?, ?);
  `;

  const [result] = await pool.query(query, [
    question,
    evaluationCriteria,
    legalBasis || null,
    category_id,
  ]);

  return result;
};

const editQuantitativeQuestionService = async (id, data) => {
  const { question, evaluationCriteria, legalBasis, category_id } = data;

  if (!question || !evaluationCriteria || !category_id) {
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
    indicatorDefinition,
    evaluationCriteria,
    referenceInfo,
    category_id,
  } = data;

  if (!indicator || !evaluationCriteria || !category_id) {
    throw new Error("필수 입력 항목이 누락되었습니다.");
  }

  const query = `
    UPDATE qualitative_questions
    SET indicator = ?, indicator_definition = ?, evaluation_criteria = ?, reference_info = ?, category_id = ?
    WHERE id = ?;
  `;

  const [result] = await pool.query(query, [
    indicator,
    indicatorDefinition || null,
    evaluationCriteria,
    referenceInfo || null,
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
};
