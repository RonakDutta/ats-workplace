import express from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  deleteCandidate,
  getAllCandidates,
  getSystemMetrics,
} from "../controller/roleController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Validate token first
router.use(authenticateToken);

router.post("/", createRole);
router.get("/", getAllRoles);
router.get("/:id", getRoleById);
router.get("/candidates/all", getAllCandidates);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);
router.delete("/candidate/:id", deleteCandidate);
router.get("/metrics/dashboard", getSystemMetrics);

export default router;
