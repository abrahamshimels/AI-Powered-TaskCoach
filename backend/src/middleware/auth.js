import jwt from "jsonwebtoken";
import { getUserById } from "../models/user.model.js";


// Middleware to protect routes
export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1]; // Bearer TOKEN

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await getUserById(decoded.id); // attach user info to request
    if (!req.user) return res.status(401).json({ error: "User not found" });
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};
