import express from "express";
import multer from "multer";
import { analyzeCandidates } from "../controller/analyzeController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
});

router.post("/", upload.array("candidates", 20), analyzeCandidates);

export default router;
