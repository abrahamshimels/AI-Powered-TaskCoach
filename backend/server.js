import express from "express";
import cors from "cors";
import dns from "dns/promises";
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

// Express 5 requires named wildcards for catch-all paths.
app.options("/{*any}", cors(corsOptions));


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
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || 3306;
  console.log(`[DATABASE] Attempting connection to ${host}:${port}...`);
  
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    console.log("✅ [DATABASE] MySQL connection successful");
    return true;
  } catch (err) {
    console.error("❌ [DATABASE] MySQL connection failed:", err.message);
    return false;
  }
};

const canResolveDatabaseHost = async (host) => {
  if (!host) {
    console.warn("⚠️ [DATABASE] DB_HOST is not configured");
    return false;
  }

  if (host === "localhost" || host === "127.0.0.1") {
    return true;
  }

  console.log(`[DATABASE] Checking DNS resolution for ${host}...`);
  try {
    // Timeout DNS lookup after 3 seconds
    await Promise.race([
      dns.lookup(host),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("DNS lookup timeout")), 3000)
      )
    ]);
    console.log(`✅ [DATABASE] DNS resolved ${host}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ [DATABASE] DNS lookup failed for ${host}: ${err.message}`);
    return false;
  }
};

// Create tasks table if not exists
const initializeDatabase = async () => {
  console.log("[DATABASE] Initializing database...");
  
  const host = process.env.DB_HOST;
  const resolvable = await canResolveDatabaseHost(host);

  if (!resolvable) {
    console.warn(`[DATABASE] Database host not resolvable, skipping table initialization`);
    return;
  }

  const connected = await testDBConnection();

  if (!connected) {
    console.warn("[DATABASE] Could not establish connection, skipping table creation");
    return;
  }

  console.log("[DATABASE] Creating tables...");
  await createTables(); // call your table creation function
  console.log("[DATABASE] Database initialization complete");
};

// Call it once at server start
initializeDatabase();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/task", taskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(70));
  console.log(`✅ [SERVER] Express server started successfully on port ${PORT}`);
  console.log(`🌐 [SERVER] API available at: http://localhost:${PORT}`);
  console.log(`📋 [CORS] Allowed origins: ${allowedOrigins.join(", ")}`);
  console.log("=".repeat(70) + "\n");
});
