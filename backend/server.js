import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

pool.query('SELECT NOW()')
    .then((result) => {
        console.log('PostgreSQL connected:', result.rows[0]);
    })
    .catch((error) => {
        console.error('Database connection error:', error);
        process.exit(1);
    });

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});