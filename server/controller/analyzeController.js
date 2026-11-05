import axios from "axios";
import FormData from "form-data";
import pool from "../config/db.js";

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const analyzeResume = async (file, description, apiKey, strictness) => {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("api_key", apiKey);
  formData.append("strictness", Number(strictness));
  formData.append("file", file.buffer, file.originalname);

  const response = await axios.post(`${ML_URL}/api/match`, formData, {
    headers: formData.getHeaders(),
  });

  return response.data;
};

const saveCandidate = async (roleId, filename, result) => {
  const newCandidate = await pool.query(
    `INSERT INTO candidates
    (role_id, filename, score, matched_skills, missing_skills, all_candidate_skills, ai_summary)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      roleId,
      filename,
      result.score,
      JSON.stringify(result.matched_skills || []),
      JSON.stringify(result.missing_skills || []),
      JSON.stringify(result.all_candidate_skills || []),
      result.ai_summary || "No summary generated.",
    ],
  );

  return newCandidate.rows[0];
};

export const analyzeCandidates = async (req, res) => {
  try {
    const { description, roleId, apiKey, strictness } = req.body;
    const files = req.files;

    if (!apiKey || apiKey.trim() === "") {
      return res.status(400).json({
        error: "Please add your Gemini API key in Settings before analyzing.",
      });
    }

    if (!roleId) {
      return res.status(400).json({
        error: "Please save the role draft before analyzing candidates.",
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No candidate files uploaded." });
    }

    const candidates = [];

    for (const file of files) {
      try {
        const result = await analyzeResume(file, description, apiKey, strictness);
        const candidate = await saveCandidate(roleId, file.originalname, result);
        candidates.push(candidate);
      } catch (error) {
        console.error(`Error analyzing ${file.originalname}:`, error.message);
      }

      await wait(4500);
    }

    candidates.sort((a, b) => b.score - a.score);
    res.status(200).json(candidates);
  } catch (error) {
    console.error("Error processing upload:", error);
    res.status(500).json({ error: "Internal server error during upload." });
  }
};
