import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./src/routes/ai.routes.js";
import taskRoutes from "./src/routes/task.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import db from "./src/config/db.js"; // MySQL pool
import { createTables } from "./src/database/tables.js"; // your table creation function

dotenv.config();

const app = express();

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "https://ai-powered-task-coach.vercel.app",
];

const normalizeOrigin = (origin) => origin?.replace(/\/$/, "");

// Comma-separated env var, e.g. CORS_ORIGINS=http://localhost:5173,https://app.example.com
const allowedOrigins = (
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => normalizeOrigin(origin.trim()))
    : defaultOrigins
).filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    console.warn(`[CORS] Blocked origin: ${normalizedOrigin}`);
    callback(new Error(`Not allowed by CORS: ${normalizedOrigin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  optionsSuccessStatus: 204,
};

app.use(
  cors(corsOptions)
);

app.options("*", cors(corsOptions));


app.use(express.json());

app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl} body= ${JSON.stringify(req.body)} headers= ${req.headers.authorization ? 'Bearer token' : 'none'}`);
  next();
});

// Basic route
app.get("/", (req, res) => {
  res.send("Express server is running!");
});

// Test database connection
const testDBConnection = async () => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    console.log("✅ MySQL connection successful:", rows[0].result === 2);
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
  }
};

// Create tasks table if not exists
const initializeDatabase = async () => {
  await testDBConnection();
  await createTables(); // call your table creation function
};

// Call it once at server start
initializeDatabase();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/task", taskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}. Allowed CORS origins: ${allowedOrigins.join(", ")}`)
);
