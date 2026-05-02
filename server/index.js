import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import pool from "./config/db.js";
import roleRoutes from "./routes/roleRoutes.js";
import { login, signup } from "./controller/authController.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
});

app.post("/api/analyze", upload.array("candidates", 20), async (req, res) => {
  try {
    const jobDescription = req.body.description;
    const roleId = req.body.roleId;
    const uploadedFiles = req.files;
    const apiKey = req.body.apiKey;
    const strictness = req.body.strictness;

    if (!roleId) {
      return res.status(400).json({
        error: "Please save the role draft before analyzing candidates.",
      });
    }

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: "No candidate files uploaded." });
    }

    const analysisResults = [];
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const file of uploadedFiles) {
      const formData = new FormData();
      formData.append("description", jobDescription);
      formData.append("api_key", apiKey);
      formData.append("strictness", Number(strictness));
      formData.append("file", fs.createReadStream(file.path), file.filename);

      try {
        const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
        const pythonResponse = await axios.post(
          `${ML_URL}/api/match`,
          formData,
          {
            headers: formData.getHeaders(),
          },
        );

        const resultData = pythonResponse.data;

        // 1. Save this specific candidate into PostgreSQL
        const insertQuery = `
          INSERT INTO candidates 
          (role_id, filename, file_path, score, matched_skills, missing_skills, all_candidate_skills, ai_summary) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;

        // Note: JSON.stringify converts our Javascript arrays into Postgres JSONB format
        const dbResult = await pool.query(insertQuery, [
          roleId,
          file.originalname,
          file.path, // We save the local uploads/ path so we can download it later!
          resultData.score,
          JSON.stringify(resultData.matched_skills || []),
          JSON.stringify(resultData.missing_skills || []),
          JSON.stringify(resultData.all_candidate_skills || []),
          resultData.ai_summary || "No summary generated.",
        ]);

        // 2. Push the saved DB record to our React array
        analysisResults.push(dbResult.rows[0]);
      } catch (pythonError) {
        console.error(
          `Error analyzing ${file.originalname}:`,
          pythonError.message,
        );
      }

      // Throttle to protect Gemini API
      await delay(4500);
    }

    // Sort the final results from highest score to lowest
    analysisResults.sort((a, b) => b.score - a.score);
    res.status(200).json(analysisResults);
  } catch (error) {
    console.error("Error processing upload:", error);
    res.status(500).json({ error: "Internal server error during upload." });
  }
});

app.use("/api/roles", roleRoutes);
app.post("/api/auth/signup", signup);
app.post("/api/auth/login", login);

app.listen(PORT, () => {
  console.log(`🚀 Node.js Backend Gateway running on http://localhost:${PORT}`);
});
