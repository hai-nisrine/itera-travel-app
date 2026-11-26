import express from 'express';
import { saveProfile } from '../controllers/accessibilityController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

router.post('/', authenticate, requireRole('traveler'), saveProfile);

export default router;
