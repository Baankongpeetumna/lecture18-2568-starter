// src/middlewares/checkRoleAdminMiddleware.ts
import { type Request, type Response, type NextFunction } from "express";
import { type CustomRequest, type User } from "../libs/types.js";
import { users } from "../db/db.js";

// interface CustomRequest extends Request {
//   user?: any; // Define the user property
//   token?: string; // Define the token property
// }

export const checkAllRole = (req: CustomRequest, res: Response, next: NextFunction) => {
  const payload = req.user;
  if (!payload) {
    return res.status(401).json({ success: false, message: "Unauthorized user" });
  }

  const user = users.find(u => u.username === payload.username);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized user" });
  }

  // admin ได้หมดจร้า
  if (payload.role === "ADMIN") return next();

  // เช็คว่าอีนักเรียนมันเลขตรงกับของตัวเองไหม
  if (payload.role === "STUDENT" && payload.studentId === req.params.studentId) return next();

  // ไม่เจอของตัวเอง
  return res.status(403).json({ success: false, message: "Forbidden access" });
};