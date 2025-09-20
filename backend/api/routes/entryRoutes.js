import express from "express";
import { addPerson, exportEntriesToExcel, getEntries } from "../controllers/entryController.js";
import upload from "../multerConfig.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

// POST person with image
router.post(
  "/add",
  authenticateUser,
  upload.single("image"), // Multer handles image
  addPerson
);
router.get("/records", authenticateUser, getEntries);
router.get("/export", authenticateUser, exportEntriesToExcel);
export default router;
