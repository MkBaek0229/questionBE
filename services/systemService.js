import pool from "../config/db.js";

const postsystemService = async (data, userId) => {
  const {
    name,
    num_data_subjects,
    purpose,
    is_private,
    is_unique,
    is_resident,
    reason,
  } = data;

  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  const [systemCount] = await pool.query(
    "SELECT COUNT(*) AS count FROM systems WHERE user_id = ?",
    [userId]
  );

  if (systemCount[0].count >= 10) {
    throw new Error("시스템은 최대 10개까지 등록 가능합니다.");
  }

  const [result] = await pool.query(
    `INSERT INTO systems (user_id, name, num_data_subjects, purpose, is_private, is_unique, is_resident, reason, assessment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '시작전')`,
    [
      userId,
      name,
      num_data_subjects,
      purpose,
      is_private === "포함",
      is_unique === "포함",
      is_resident === "포함",
      reason,
    ]
  );

  return {
    message: "시스템 등록이 완료되었습니다.",
    systemId: result.insertId,
  };
};

const getsystemsService = async (userId) => {
  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  const [systems] = await pool.query(
    `SELECT 
        systems.id AS systems_id,
        systems.name AS system_name,
        systems.purpose,
        systems.assessment_status,
        systems.user_id,
        User.institution_name,
        User.representative_name
     FROM systems
     INNER JOIN User ON systems.user_id = User.id
     WHERE systems.user_id = ?
     ORDER BY systems.created_at DESC`,
    [userId]
  );

  return systems;
};

const getSystemByIdService = async (id) => {
  const [system] = await pool.query(
    `SELECT 
        systems.id AS systems_id,
        systems.name AS system_name,
        systems.purpose,
        systems.num_data_subjects,
        systems.assessment_status,
        User.institution_name,
        User.representative_name
     FROM systems
     INNER JOIN User ON systems.user_id = User.id
     WHERE systems.id = ?`,
    [id]
  );

  if (system.length === 0) {
    throw new Error("시스템을 찾을 수 없습니다.");
  }

  return system[0];
};

const updateSystemService = async (id, data) => {
  const { name, purpose, num_data_subjects } = data;

  const [result] = await pool.query(
    `UPDATE systems
     SET name = ?, purpose = ?, num_data_subjects = ?
     WHERE id = ?`,
    [name, purpose, num_data_subjects, id]
  );

  if (result.affectedRows === 0) {
    throw new Error("시스템을 찾을 수 없습니다.");
  }

  return { message: "시스템 정보가 성공적으로 업데이트되었습니다." };
};

const deleteSystemService = async (id) => {
  const [result] = await pool.query("DELETE FROM systems WHERE id = ?", [id]);

  if (result.affectedRows === 0) {
    throw new Error("삭제할 시스템을 찾을 수 없습니다.");
  }

  return { message: "시스템이 성공적으로 삭제되었습니다." };
};

const getAllSystemsService = async () => {
  const [systems] = await pool.query(
    `SELECT 
        systems.id AS systems_id,
        systems.name AS system_name,
        systems.purpose,
        systems.num_data_subjects,
        systems.assessment_status,
        User.institution_name AS user_institution_name,
        User.representative_name AS user_representative_name,
        User.email AS user_email
     FROM systems
     INNER JOIN User ON systems.user_id = User.id
     ORDER BY systems.created_at DESC`
  );

  return systems;
};

export {
  postsystemService,
  getsystemsService,
  getSystemByIdService,
  updateSystemService,
  deleteSystemService,
  getAllSystemsService,
};
