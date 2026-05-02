import pool from "../config/db.js";

export const createRole = async (req, res) => {
  try {
    const { title, description } = req.body;

    const newRole = await pool.query(
      "INSERT INTO roles (title, description, user_id) VALUES ($1, $2, $3) RETURNING *",
      [title, description, req.user.id],
    );

    res.status(201).json(newRole.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Server error while saving draft." });
  }
};

// Update an existing job role
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const updatedRole = await pool.query(
      "UPDATE roles SET title = $1, description = $2 WHERE id = $3 RETURNING *",
      [title, description, id],
    );

    if (updatedRole.rows.length === 0) {
      return res.status(404).json({ error: "Role not found." });
    }

    res.status(200).json(updatedRole.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Server error updating draft." });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const allRoles = await pool.query(
      "SELECT * FROM roles WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id],
    );
    res.status(200).json(allRoles.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Server error fetching roles." });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch the Job Description
    const roleResult = await pool.query("SELECT * FROM roles WHERE id = $1", [
      id,
    ]);

    if (roleResult.rows.length === 0) {
      return res.status(404).json({ error: "Role not found." });
    }

    // 2. Fetch all candidates linked to this role, ordered by highest score
    const candidatesResult = await pool.query(
      "SELECT * FROM candidates WHERE role_id = $1 ORDER BY score DESC",
      [id],
    );

    // 3. Package it together nicely for React
    const masterPayload = {
      role: roleResult.rows[0],
      candidates: candidatesResult.rows,
    };

    res.status(200).json(masterPayload);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Server error fetching role details." });
  }
};

// Get ALL candidates across ALL roles
export const getAllCandidates = async (req, res) => {
  try {
    const query = `
      SELECT candidates.*, roles.title AS role_title 
      FROM candidates 
      JOIN roles ON candidates.role_id = roles.id 
      WHERE roles.user_id = $1 
      ORDER BY candidates.score DESC, candidates.created_at DESC
    `;
    const result = await pool.query(query, [req.user.id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Server error fetching all candidates." });
  }
};

// Delete a Role (This automatically deletes linked candidates due to CASCADE)
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRole = await pool.query(
      "DELETE FROM roles WHERE id = $1 RETURNING *",
      [id],
    );

    if (deletedRole.rows.length === 0) {
      return res.status(404).json({ error: "Role not found." });
    }
    res.status(200).json({ message: "Role deleted successfully." });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Server error deleting role." });
  }
};

// Delete a specific Candidate
export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCandidate = await pool.query(
      "DELETE FROM candidates WHERE id = $1 RETURNING *",
      [id],
    );

    if (deletedCandidate.rows.length === 0) {
      return res.status(404).json({ error: "Candidate not found." });
    }
    res.status(200).json({ message: "Candidate deleted successfully." });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Server error deleting candidate." });
  }
};

// Metrics
// Get System Metrics for the Analytics Dashboard (Secured to Logged-in User)
export const getSystemMetrics = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Top-Level KPIs (Filtered by user_id)
    const kpiQuery = `
      SELECT 
        (SELECT COUNT(*) FROM candidates c JOIN roles r ON c.role_id = r.id WHERE r.user_id = $1) as total_candidates,
        (SELECT COUNT(*) FROM roles WHERE user_id = $1) as total_roles,
        (SELECT ROUND(AVG(score)) FROM candidates c JOIN roles r ON c.role_id = r.id WHERE r.user_id = $1) as avg_score
    `;
    const kpiResult = await pool.query(kpiQuery, [userId]);

    // 2. The Skill Gap (Filtered by user_id)
    const skillsQuery = `
      SELECT skill, COUNT(*) as count
      FROM candidates c
      JOIN roles r ON c.role_id = r.id,
      jsonb_array_elements_text(c.missing_skills::jsonb) as skill
      WHERE r.user_id = $1
      GROUP BY skill
      ORDER BY count DESC
      LIMIT 6
    `;
    const skillsResult = await pool.query(skillsQuery, [userId]);

    // 3. Talent Distribution (Filtered by user_id)
    const distQuery = `
      SELECT 
        SUM(CASE WHEN c.score >= 80 THEN 1 ELSE 0 END) as top_tier,
        SUM(CASE WHEN c.score >= 60 AND c.score < 80 THEN 1 ELSE 0 END) as good_fit,
        SUM(CASE WHEN c.score < 60 THEN 1 ELSE 0 END) as poor_fit
      FROM candidates c
      JOIN roles r ON c.role_id = r.id
      WHERE r.user_id = $1
    `;
    const distResult = await pool.query(distQuery, [userId]);

    // 4. Processing Volume (Filtered by user_id)
    const volumeQuery = `
      SELECT TO_CHAR(c.created_at, 'Mon DD') as date, COUNT(*) as count
      FROM candidates c
      JOIN roles r ON c.role_id = r.id
      WHERE r.user_id = $1 AND c.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(c.created_at, 'Mon DD'), c.created_at::date
      ORDER BY c.created_at::date ASC
    `;
    const volumeResult = await pool.query(volumeQuery, [userId]);

    // Send the isolated payload back to React
    res.status(200).json({
      kpis: kpiResult.rows[0],
      skillGap: skillsResult.rows,
      distribution: distResult.rows[0],
      volume: volumeResult.rows,
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ error: "Server error fetching metrics." });
  }
};
