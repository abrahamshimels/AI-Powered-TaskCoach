import db from "../config/db.js";

export const createUser = async (userData) => {
  // Implementation to create a new user in the database
    const { id,username, password_hash, email } = userData;
    const password = password_hash; // assuming password is already hashed
    const [result] = await db.query(
      `
      INSERT INTO users (id ,username, password, email)
      VALUES (?, ?, ?, ?)
      `,
      [id, username, password, email]
    );
    return { id: result.insertId, ...userData };
};

export const getUserByUsername = async (username) => {
  // Implementation to get user by username from the database
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length === 0) return null;
    return rows[0];
}

export const getUserById = async (id) => {
  // Implementation to get user by ID from the database
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) return null;
    return rows[0];
};

export const updateUser = async (id, userData) => {
  // Implementation to update user details in the database
    const fields = [];
    const values = [];

    for (const key in userData) {       
        fields.push(`${key} = ?`);
        values.push(userData[key]);
    }
    values.push(id);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    await db.query(sql, values);
};

export const deleteUser = async (id) => {
  // Implementation to delete a user from the database
    await db.query("DELETE FROM users WHERE id = ?", [id]);
};