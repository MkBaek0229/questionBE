import {
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
} from "../services/superuserService.js";
import AppError from "../utils/appError.js";

const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersService();
    res.status(200).json({
      resultCode: "S-1",
      msg: "모든 유저 조회 성공",
      data: users,
    });
  } catch (error) {
    next(new AppError("모든 유저 조회 실패: " + error.message, 500));
  }
};

const getUserById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await getUserByIdService(id);
    res.status(200).json({
      resultCode: "S-1",
      msg: "유저 조회 성공",
      data: user,
    });
  } catch (error) {
    next(new AppError("유저 조회 실패: " + error.message, 500));
  }
};

const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    await deleteUserService(id);
    res.status(200).json({
      resultCode: "S-1",
      msg: "유저 삭제 성공",
    });
  } catch (error) {
    next(new AppError("유저 삭제 실패: " + error.message, 500));
  }
};

const getAllExperts = async (req, res, next) => {
  try {
    const experts = await getAllExpertsService();
    res.status(200).json({
      resultCode: "S-1",
      msg: "모든 전문가 조회 성공",
      data: experts,
    });
  } catch (error) {
    next(new AppError("모든 전문가 조회 실패: " + error.message, 500));
  }
};

const getExpertById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const expert = await getExpertByIdService(id);
    res.status(200).json({
      resultCode: "S-1",
      msg: "관리자 조회 성공",
      data: expert,
    });
  } catch (error) {
    next(new AppError("관리자 조회 실패: " + error.message, 500));
  }
};

const deleteExpert = async (req, res, next) => {
  const { id } = req.params;
  try {
    await deleteExpertService(id);
    res.status(200).json({
      resultCode: "S-1",
      msg: "관리자 삭제 성공",
    });
  } catch (error) {
    next(new AppError("관리자 삭제 실패: " + error.message, 500));
  }
};

const getAllSystems = async (req, res, next) => {
  try {
    const systems = await getAllSystemsService();
    res.status(200).json({
      resultCode: "S-1",
      msg: "모든 시스템 조회 성공",
      data: systems,
    });
  } catch (error) {
    next(new AppError("모든 시스템 조회 실패: " + error.message, 500));
  }
};

const getMatchedExperts = async (req, res, next) => {
  const { systemId } = req.query;
  try {
    const experts = await getMatchedExpertsService(systemId);
    res.status(200).json({
      resultCode: "S-1",
      msg: "시스템에 매칭된 전문가 조회 성공",
      data: experts,
    });
  } catch (error) {
    next(
      new AppError("시스템에 매칭된 전문가 조회 실패: " + error.message, 500)
    );
  }
};

const loginSuperUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const superuser = await loginSuperUserService(email, password, req);
    res.status(200).json({
      message: "로그인 성공",
      data: superuser,
    });
  } catch (error) {
    next(new AppError("로그인 실패: " + error.message, 500));
  }
};

const logoutSuperUser = (req, res, next) => {
  try {
    logoutSuperUserService(req, res);
    res.status(200).json({ message: "로그아웃 성공" });
  } catch (error) {
    next(new AppError("로그아웃 실패: " + error.message, 500));
  }
};

const getSystemById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const system = await getSystemByIdService(id);
    res.status(200).json(system);
  } catch (error) {
    next(new AppError("시스템 조회 실패: " + error.message, 500));
  }
};

const matchExpertsToSystem = async (req, res, next) => {
  const { systemId, expertIds } = req.body;
  try {
    await matchExpertsToSystemService(systemId, expertIds);
    res.status(200).json({
      resultCode: "S-1",
      msg: "전문가 매칭 성공",
    });
  } catch (error) {
    next(new AppError("전문가 매칭 실패: " + error.message, 500));
  }
};

const deleteSystemBySuperUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    await deleteSystemBySuperUserService(id);
    res.status(200).json({ message: "시스템 삭제 성공" });
  } catch (error) {
    next(new AppError("시스템 삭제 실패: " + error.message, 500));
  }
};

const SupergetQuantitativeQuestions = async (req, res, next) => {
  try {
    const questions = await SupergetQuantitativeQuestionsService();
    res.status(200).json({
      resultCode: "S-1",
      msg: "정량적 질문 조회 성공",
      data: questions,
    });
  } catch (error) {
    next(new AppError("정량적 질문 조회 실패: " + error.message, 500));
  }
};

const SupergetQualitativeQuestions = async (req, res, next) => {
  try {
    const questions = await SupergetQualitativeQuestionsService();
    res.status(200).json({
      resultCode: "S-1",
      msg: "정성적 질문 조회 성공",
      data: questions,
    });
  } catch (error) {
    next(new AppError("정성적 질문 조회 실패: " + error.message, 500));
  }
};

const SupergetQuantitativeResponses = async (req, res, next) => {
  const { systemId } = req.params;
  try {
    const responses = await SupergetQuantitativeResponsesService(systemId);
    res.status(200).json({
      resultCode: "S-1",
      msg: "특정 시스템의 정량적 응답 조회 성공",
      data: responses,
    });
  } catch (error) {
    next(
      new AppError("특정 시스템의 정량적 응답 조회 실패: " + error.message, 500)
    );
  }
};

const SupergetQualitativeResponses = async (req, res, next) => {
  const { systemId } = req.params;
  try {
    const responses = await SupergetQualitativeResponsesService(systemId);
    res.status(200).json({
      resultCode: "S-1",
      msg: "특정 시스템의 정성적 응답 조회 성공",
      data: responses,
    });
  } catch (error) {
    next(
      new AppError("특정 시스템의 정성적 응답 조회 실패: " + error.message, 500)
    );
  }
};

const addQuantitativeQuestion = async (req, res, next) => {
  try {
    const result = await addQuantitativeQuestionService(req.body);
    res
      .status(201)
      .json({ message: "문항이 추가되었습니다.", id: result.insertId });
  } catch (error) {
    next(new AppError("문항 추가 실패: " + error.message, 500));
  }
};

const editQuantitativeQuestion = async (req, res, next) => {
  const { id } = req.params;
  try {
    await editQuantitativeQuestionService(id, req.body);
    res.status(200).json({ message: "문항이 수정되었습니다." });
  } catch (error) {
    next(new AppError("문항 수정 실패: " + error.message, 500));
  }
};

const deleteQuantitativeQuestion = async (req, res, next) => {
  const { id } = req.params;
  try {
    await deleteQuantitativeQuestionService(id);
    res.status(200).json({ message: "문항이 삭제되었습니다." });
  } catch (error) {
    next(new AppError("문항 삭제 실패: " + error.message, 500));
  }
};

const addQualitativeQuestion = async (req, res, next) => {
  try {
    const result = await addQualitativeQuestionService(req.body);
    res
      .status(201)
      .json({ message: "문항이 추가되었습니다.", id: result.insertId });
  } catch (error) {
    next(new AppError("문항 추가 실패: " + error.message, 500));
  }
};

const editQualitativeQuestion = async (req, res, next) => {
  const { id } = req.params;
  try {
    await editQualitativeQuestionService(id, req.body);
    res.status(200).json({ message: "문항이 수정되었습니다." });
  } catch (error) {
    next(new AppError("문항 수정 실패: " + error.message, 500));
  }
};

const deleteQualitativeQuestion = async (req, res, next) => {
  const { id } = req.params;
  try {
    await deleteQualitativeQuestionService(id);
    res.status(200).json({ message: "문항이 삭제되었습니다." });
  } catch (error) {
    next(new AppError("문항 삭제 실패: " + error.message, 500));
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await getCategoriesService();
    res.json(categories);
  } catch (error) {
    next(new AppError("카테고리 조회 실패: " + error.message, 500));
  }
};

const addCategory = async (req, res, next) => {
  const { name } = req.body;
  try {
    await addCategoryService(name);
    res.status(201).json({ message: "카테고리 추가 완료" });
  } catch (error) {
    next(new AppError("카테고리 추가 실패: " + error.message, 500));
  }
};

const updateCategory = async (req, res, next) => {
  const { categoryId } = req.params;
  const { name } = req.body;
  try {
    await updateCategoryService(categoryId, name);
    res.status(200).json({ message: "카테고리 수정 완료" });
  } catch (error) {
    next(new AppError("카테고리 수정 실패: " + error.message, 500));
  }
};

const deleteCategory = async (req, res, next) => {
  const { categoryId } = req.params;
  try {
    await deleteCategoryService(categoryId);
    res.status(200).json({ message: "카테고리 삭제 완료" });
  } catch (error) {
    next(new AppError("카테고리 삭제 실패: " + error.message, 500));
  }
};

export {
  getAllUsers,
  getUserById,
  deleteUser,
  getAllExperts,
  getExpertById,
  deleteExpert,
  getAllSystems,
  getMatchedExperts,
  loginSuperUser,
  logoutSuperUser,
  getSystemById,
  matchExpertsToSystem,
  deleteSystemBySuperUser,
  SupergetQuantitativeQuestions,
  SupergetQualitativeQuestions,
  SupergetQuantitativeResponses,
  SupergetQualitativeResponses,
  addQuantitativeQuestion,
  editQuantitativeQuestion,
  deleteQuantitativeQuestion,
  addQualitativeQuestion,
  editQualitativeQuestion,
  deleteQualitativeQuestion,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
};
