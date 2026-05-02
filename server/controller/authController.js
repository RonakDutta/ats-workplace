import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userCheck.rows.length > 0)
      return res.status(400).json({ error: "User already exists." });

    // 2. Hash the password (cost factor of 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Save the new user
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword],
    );

    // 4. Create a token and send it back
    const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({ token, user: newUser.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during signup." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userResult.rows.length === 0)
      return res.status(400).json({ error: "Invalid credentials." });
    const user = userResult.rows[0];

    // 2. Compare passwords
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ error: "Invalid credentials." });

    // 3. Issue Token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during login." });
  }
};
