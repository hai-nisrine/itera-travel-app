import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import accessibilityRoutes from './routes/accessibilityRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

//api prefix marks these as backend endpoints, not frontend pages
app.use('/api/accessibility', accessibilityRoutes);
app.use('/api/auth', authRoutes);

try {
    const result = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected:', result.rows[0]);

    app.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
} catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
}