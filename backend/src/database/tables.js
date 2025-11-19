// tables.js
import db from "../config/db.js";

// Create Users Table
export const createUsersTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) PRIMARY KEY,           -- UUID
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,    -- hashed password
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Users table created or already exists");
  } catch (err) {
    console.error("❌ Error creating users table:", err.message);
  }
};

// Create Tasks Table
export const createTasksTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id CHAR(36) PRIMARY KEY,  -- UUID
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority ENUM('low','medium','high') DEFAULT 'medium',
        status ENUM('pending','in-progress','completed') DEFAULT 'pending',
        due_date DATETIME NULL,
        created_by_ai BOOLEAN DEFAULT FALSE,
        user_id CHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    console.log("✅ Tasks table created or already exists");
  } catch (err) {
    console.error("❌ Error creating tasks table:", err.message);
  }
};

// Run both tables in order
export const createTables = async () => {
  await createUsersTable();
  await createTasksTable();
};
