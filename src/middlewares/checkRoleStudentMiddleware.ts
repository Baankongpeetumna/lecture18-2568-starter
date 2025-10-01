// src/middlewares/checkRoleAdminMiddleware.ts
import { type Request, type Response, type NextFunction } from "express";
import { type CustomRequest, type User } from "../libs/types.js";
import { users } from "../db/db.js";

// interface CustomRequest extends Request {
//   user?: any; // Define the user property
//   token?: string; // Define the token property
// }

export const checkRoleStudent = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const payload = req.user;

  if (!payload) {
    return res.status(401).json({ success: false, message: "Unauthorized user" });
  }

  const user = users.find((u: User) => u.username === payload.username);
  if (!user || user.role !== "STUDENT") {
    return res.status(401).json({ success: false, message: "Unauthorized user" });
  }

  // เช็คว่า STUDENT เรียกใช้ข้อมูลของตัวเองหรือไม่
  if (payload.studentId !== req.params.studentId) {
    return res.status(403).json({ success: false, message: "Forbidden access" });
  }

  next();
};
