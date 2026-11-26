import pool from '../config/db.js';

export async function findUserByEmail(email) {
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    return result.rows[0];
}

export async function findUserById(id) {
    const result = await pool.query(
        'SELECT id, name, email, phone_number, role, created_at FROM users WHERE id = $1',
        [id]
    );
    return result.rows[0];
}

// db defaults to the pool; pass a client to run it inside a transaction (PR #2)
export async function createUser({ name, email, phone_number, password_hash, role = 'traveler' }, db = pool) {
    const result = await db.query(
        `INSERT INTO users (name, email, phone_number, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, phone_number, role, created_at`,
        [name, email, phone_number, password_hash, role]
    );
    return result.rows[0];
}
