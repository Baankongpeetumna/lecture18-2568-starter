import { Router, type Request, type Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import type {
  User,
  CustomRequest,
  UserPayload,
  Enrollment,
} from "../libs/types.js";

// import database
import { users, reset_users, DB, enrollments, students } from "../db/db.js";

import { authenticateToken } from "../middlewares/authenMiddleware.js";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.js";
import { checkRoleStudent } from "../middlewares/checkRoleStudentMiddleware.js";
import { checkAllRole } from "../middlewares/checkAllRoleMiddleware.js";

const router = Router();
//เช็คเอนโรเม้น
router.get(
  "/",
  authenticateToken,
  checkRoleAdmin,
  (req: CustomRequest, res: Response) => {
    try {
      const grouped = users.map((u) => {
        const courses = enrollments
          .filter((e) => e.studentId === u.studentId)
          .map((e) => ({ courseId: e.courseId }));

        return {
          studentId: u.studentId,
          courses,
        };
      });

      return res.status(200).json({
        success: true,
        message: "Enrollments Information",
        data: grouped,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Something is wrong, please try again",
        error: err,
      });//ของ 670610714 อย่าก็อปอ้ายเด้อจ้า
    }
  }
);
//รีเซ็ต
router.post(
  "/reset",
  authenticateToken,
  checkRoleAdmin,
  (req: Request, res: Response) => {
    try {
      reset_users();
      return res.status(200).json({
        success: true,
        message: "enrollments database has been reset",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Something is wrong, please try again",
        error: err,
      });
    }
  }
);
//ดูนรเช็คได้แค่ตัวเอง อีแอดมินเช็คได้หมด
router.get(
  "/:studentId",
  authenticateToken,
  checkAllRole,
  (req: CustomRequest, res: Response) => {
    const { studentId } = req.params;
    const student = students.find((s) => s.studentId === studentId);

    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    return res.status(200).json({
      success: true,
      message: "Student Information",
      data: student,
    });
  }
);

router.post(
  "/:studentId",
  authenticateToken,
  checkAllRole,
  (req: CustomRequest, res: Response) => {
    const { studentId } = req.params;
    const { courseId } = req.body as { courseId: string };
    const payload = req.user;

    // แอดมินอย่ายุ่ง
    if (payload?.role === "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden access" });
    }
    //เช็คว่ารหัสตรงกันไหมจ้ะ
    const student = students.find((s) => s.studentId === studentId);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    //บางคนไม่มี คอด
    if (!student.courses) student.courses = [];

    if (student.courses.includes(courseId)) {
      return res
        .status(400)
        .json({
          success: false,
          message: `${studentId} && ${courseId} is already exists`,
        });
    }
    //เพิ่มคอด
    student.courses.push(courseId);

    return res.status(201).json({
      success: true,
      message: `Student ${studentId} && Course ${courseId} has been added successfully`,
      data: { studentId: student.studentId, courseId },
    });
  }
);

router.delete("/:studentId", authenticateToken, checkRoleStudent, (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.body as { courseId: string };

    // หาเด็ก
    const student = students.find(s => s.studentId === studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // ถ้าเด็กยังไม่มีวิชานี้
    if (!student.courses || student.courses.length === 0 || !student.courses.includes(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Enrollment does not exists"
      });
    }

    // ลบคอด
    student.courses = student.courses.filter(c => c !== courseId);

    // ส่งคอดที่เหลือ
    return res.status(200).json({
      success: true,
      message: `Student ${studentId} && Course ${courseId} has been deleted successfully`,
      data: student.courses.map(c => ({
        studentId: student.studentId,
        courseId: c
      }))
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again",
      error: err
    });
  }
});

export default router;
