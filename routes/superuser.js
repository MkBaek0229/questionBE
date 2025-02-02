import express from "express";
import bcrypt from "bcrypt";
import pool from "../db/connection.js"; // 데이터베이스 연결

const router = express.Router();

/**
 * 🔹 슈퍼유저 로그인
 */
const loginSuperUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "이메일과 비밀번호를 입력해주세요." });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM SuperUser WHERE email = ?", [
      email,
    ]);
    if (!rows || rows.length === 0) {
      return res
        .status(400)
        .json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    const superuser = rows[0];
    const isMatch = password === superuser.password; // 단순 비교로 변경

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    req.session.superuser = {
      id: superuser.id,
      email: superuser.email,
      name: superuser.name,
      member_type: superuser.member_type,
    };

    res.status(200).json({
      message: "로그인 성공",
      data: req.session.superuser,
    });
  } catch (error) {
    console.error("슈퍼유저 로그인 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

/**
 * 🔹 전문가와 시스템 매칭
 */
const matchExpertsToSystem = async (req, res) => {
  const { systemId, expertIds } = req.body;

  if (!systemId || !Array.isArray(expertIds) || expertIds.length === 0) {
    return res.status(400).json({
      resultCode: "F-1",
      msg: "시스템 ID와 전문가 ID 목록을 제공해야 합니다.",
    });
  }

  try {
    // ✅ 기존에 배정된 전문가 조회 (중복 체크용)
    const checkQuery = `
      SELECT expert_id FROM assignment WHERE systems_id = ?;
    `;
    const [existingAssignments] = await pool.query(checkQuery, [systemId]);

    // 기존에 배정된 전문가 ID 목록
    const existingExpertIds = new Set(
      existingAssignments.map((row) => row.expert_id)
    );

    // ✅ 새로 추가할 전문가만 필터링 (중복 제거)
    const newExpertIds = expertIds.filter(
      (expertId) => !existingExpertIds.has(expertId)
    );

    if (newExpertIds.length === 0) {
      return res.status(409).json({
        resultCode: "F-2",
        msg: "모든 전문가가 이미 배정되어 있습니다.",
      });
    }

    // ✅ 중복되지 않은 전문가만 새로 추가
    const values = newExpertIds.map((expertId) => [expertId, systemId, false]);
    const insertQuery = `
      INSERT INTO assignment (expert_id, systems_id, feedback_status) 
      VALUES ?;
    `;

    await pool.query(insertQuery, [values]);

    res.status(200).json({
      resultCode: "S-1",
      msg: "새로운 전문가 매칭이 성공적으로 완료되었습니다.",
    });
  } catch (error) {
    console.error("❌ [MATCH EXPERTS TO SYSTEM] 매칭 실패:", error.message);
    res.status(500).json({
      resultCode: "F-1",
      msg: "매칭 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

/**
 * 🔹 시스템에 매칭된 전문가 조회
 */
const getMatchedExperts = async (req, res) => {
  const { systemId } = req.query;

  // 시스템 ID 확인
  if (!systemId) {
    console.error("❌ [GET MATCHED EXPERTS] systemId가 제공되지 않았습니다.");
    return res.status(400).json({
      resultCode: "F-1",
      msg: "시스템 ID를 제공해야 합니다.",
    });
  }

  try {
    console.log("✅ [GET MATCHED EXPERTS] 전달된 systemId:", systemId);

    const query = `
      SELECT 
        e.id AS expert_id, 
        e.name AS expert_name, 
        e.institution_name, 
        e.email
      FROM assignment a
      JOIN expert e ON a.expert_id = e.id
      WHERE a.systems_id = ?;
    `;

    // SQL 쿼리 실행
    console.log("📋 [QUERY] 실행 SQL:", query, [systemId]);
    const [rows] = await pool.query(query, [systemId]);

    // 결과 확인
    if (rows.length === 0) {
      console.warn(
        "⚠️ [GET MATCHED EXPERTS] 매칭된 전문가가 없습니다:",
        systemId
      );
      return res.status(200).json({
        resultCode: "S-1",
        msg: "매칭된 전문가가 없습니다.",
        data: [],
      });
    }

    console.log("✅ [GET MATCHED EXPERTS] 조회 성공:", rows);
    res.status(200).json({
      resultCode: "S-1",
      msg: "시스템에 매칭된 전문가 조회 성공",
      data: rows,
    });
  } catch (error) {
    console.error("❌ [GET MATCHED EXPERTS] 조회 오류:", error);
    res.status(500).json({
      resultCode: "F-1",
      msg: "서버 에러 발생",
      error: error.message,
    });
  }
};
/**
 * 🔹 모든 시스템 조회 (슈퍼유저 전용)
 */
const getAllSystems = async (req, res) => {
  try {
    const query = `
      SELECT s.id AS systems_id, s.name AS system_name, u.institution_name, u.email AS user_email
      FROM systems s
      JOIN User u ON s.user_id = u.id;
    `;

    const [rows] = await pool.query(query);

    res.status(200).json({
      resultCode: "S-1",
      msg: "모든 시스템 조회 성공",
      data: rows,
    });
  } catch (error) {
    console.error("❌ [GET ALL SYSTEMS] 조회 오류:", error);
    res.status(500).json({
      resultCode: "F-1",
      msg: "서버 에러 발생",
      error: error.message,
    });
  }
};

export {
  getAllSystems,
  getMatchedExperts,
  loginSuperUser,
  matchExpertsToSystem,
};
