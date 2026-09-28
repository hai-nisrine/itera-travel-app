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
app.use('/api/accessibility', accessibilityRoutes); //we use /api to clarify that this URL is for backend functions not frontend like displaying a page
pool.query('SELECT NOW()').then(result => {
    console.log('PostgreSQL connected:', result.rows[0]);
}) 
.catch(error => {
    console.error('Database connection error:', error);
})

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