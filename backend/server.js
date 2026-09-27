import express from 'express';
import dotenv from 'dotenv';
import pool from './config/db.js';
import cors from 'cors';
import pg from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
pool.query('SELECT NOW()').then(result => {
    console.log('PostgreSQL connected:', result.rows[0]);
}) 
.catch(error => {
    console.error('Database connection error:', error);
})

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
})

