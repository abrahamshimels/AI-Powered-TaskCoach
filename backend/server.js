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

// List of allowed origins
const allowedOrigins = [
  "http://localhost:5173", // Vite dev
  "https://your-production-domain.com" // production
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true); // origin allowed
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // allow cookies or auth headers
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);


app.use(express.json());

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
  console.log(`Server running on http://localhost:${PORT}`)
);
