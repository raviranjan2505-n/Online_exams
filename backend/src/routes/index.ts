import { Router } from "express";
import * as admin from "../controllers/admin.controller";
import * as auth from "../controllers/auth.controller";
import * as student from "../controllers/student.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { uploadProfilePic } from "../middleware/upload";

const router = Router();

/* ---- public ---- */
router.post("/auth/register", uploadProfilePic, auth.register);
router.post("/auth/login", auth.login);
router.get("/auth/me", requireAuth, auth.me);

/* ---- admin ---- */
const a = Router();
a.use(requireAuth, requireRole("ADMIN"));
a.get("/dashboard", admin.dashboard);

a.get("/exams", admin.listExams);
a.post("/exams", admin.createExam);
a.get("/exams/:id", admin.getExam);
a.put("/exams/:id", admin.updateExam);
a.delete("/exams/:id", admin.deleteExam);
a.get("/exams/:id/results", admin.examResults);
a.get("/exams/:id/questions", admin.listQuestions);
a.post("/exams/:id/questions", admin.createQuestion);

a.get("/questions/:id", admin.getQuestion);
a.put("/questions/:id", admin.updateQuestion);
a.delete("/questions/:id", admin.deleteQuestion);

a.get("/students", admin.listStudents);
a.delete("/students/:id", admin.deleteStudent);
a.post("/students/:id/reset-password", admin.resetStudentPassword);
router.use("/admin", a);

/* ---- student ---- */
const s = Router();
s.use(requireAuth, requireRole("STUDENT"));
s.get("/dashboard", student.dashboard);
s.get("/results", student.myResults);
s.get("/results/:id", student.reviewResult);
s.get("/exams/:id", student.startExam);
s.post("/exams/:id/submit", student.submitExam);
s.get("/profile", student.getProfile);
s.put("/profile", student.updateProfile);
s.post("/profile/picture", uploadProfilePic, student.updatePicture);
s.post("/profile/password", student.updatePassword);
router.use("/student", s);

export default router;
