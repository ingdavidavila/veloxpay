const { v4: uuidv4 } = require("uuid");
const pool = require("../db");

const findOrCreateSocialUser = async (provider, providerId, email, name, avatar) => {
  // Map provider to column name
  const providerColumn = `${provider}_id`;

  try {
    // Step 1: Check if user exists with the provider ID
    const existingUserQuery = `SELECT * FROM users WHERE ${providerColumn} = $1`;
    const existingUserResult = await pool.query(existingUserQuery, [providerId]);

    if (existingUserResult.rows.length > 0) {
      // User exists, return it
      return existingUserResult.rows[0];
    }

    // Step 2: User does not exist with provider ID, check if email exists
    const emailCheckQuery = "SELECT * FROM users WHERE email = $1";
    const emailCheckResult = await pool.query(emailCheckQuery, [email]);

    if (emailCheckResult.rows.length > 0) {
      // Email exists but with different provider
      throw new Error("Email already exists with a different login method");
    }

    // Step 3: Email does not exist, create new user
    const id = uuidv4();
    const insertQuery = `
      INSERT INTO users (id, email, name, avatar, ${providerColumn}, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const insertValues = [id, email, name, avatar, providerId];
    const insertResult = await pool.query(insertQuery, insertValues);

    // Return the newly created user
    return insertResult.rows[0];
  } catch (error) {
    console.error("Error in findOrCreateSocialUser:", error);
    throw error;
  }
};

module.exports = { findOrCreateSocialUser };