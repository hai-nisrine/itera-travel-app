import express from 'express';
import { saveProfile } from '../controllers/accessibilityController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, saveProfile); //waits for a request, authenticates first then saves the accessblt profile

export default router;