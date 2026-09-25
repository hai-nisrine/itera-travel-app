import express from 'express';
import dotenv from 'dotenv';
import pool from './config/db.js';
import cors from 'cors';
import pg from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
})

