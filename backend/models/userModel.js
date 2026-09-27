import pool from '../config/db.js';

export async function findUserByEmail(email) {
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    return result.rows[0];
}

export async function createUser({ name, email, phone_number, password_hash }) {
    const result = await pool.query(
        `INSERT INTO users (name, email, phone_number, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, phone_number, created_at`,
        [name, email, phone_number, password_hash]
    );
    return result.rows[0];
}