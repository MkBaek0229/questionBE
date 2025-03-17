import {
  postsystemService,
  getsystemsService,
  getSystemByIdService,
  updateSystemService,
  deleteSystemService,
  getAllSystemsService,
} from "../services/systemService.js";
import AppError from "../utils/appError.js";

const postsystem = async (req, res, next) => {
  try {
    const result = await postsystemService(req.body, req.session.user?.id);
    res.status(201).json(result);
  } catch (error) {
    next(
      new AppError("시스템 등록 중 오류가 발생했습니다: " + error.message, 500)
    );
  }
};

const getsystems = async (req, res, next) => {
  try {
    const result = await getsystemsService(req.session.user?.id);
    res.status(200).json(result);
  } catch (error) {
    next(
      new AppError(
        "시스템 목록 조회 중 오류가 발생했습니다: " + error.message,
        500
      )
    );
  }
};

const getSystemById = async (req, res, next) => {
  try {
    const result = await getSystemByIdService(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(
      new AppError("시스템 조회 중 오류가 발생했습니다: " + error.message, 500)
    );
  }
};

const updateSystem = async (req, res, next) => {
  try {
    const result = await updateSystemService(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(
      new AppError(
        "시스템 업데이트 중 오류가 발생했습니다: " + error.message,
        500
      )
    );
  }
};

const deleteSystem = async (req, res, next) => {
  try {
    const result = await deleteSystemService(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(
      new AppError("시스템 삭제 중 오류가 발생했습니다: " + error.message, 500)
    );
  }
};

const getAllSystems = async (req, res, next) => {
  try {
    const result = await getAllSystemsService();
    res.status(200).json(result);
  } catch (error) {
    next(
      new AppError(
        "시스템 목록 조회 중 오류가 발생했습니다: " + error.message,
        500
      )
    );
  }
};

export {
  postsystem,
  getsystems,
  getSystemById,
  updateSystem,
  deleteSystem,
  getAllSystems,
};
