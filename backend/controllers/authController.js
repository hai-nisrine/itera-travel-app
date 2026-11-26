import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserById, createUser } from '../models/userModel.js';
import { getAccessibilityProfile } from '../models/accessibilityModel.js';

const SALT_ROUNDS = 10;

const normalizeEmail = (email) => String(email).trim().toLowerCase();

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

function signToken(user) {
    return jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

// traveler -> accessibility profile, organizer -> organizer profile (added in PR #2)
async function loadProfile(user) {
    if (user.role === 'traveler') return (await getAccessibilityProfile(user.id)) ?? null;
    return null;
}

export async function signup(req, res) {
    try {
        const { name, email, phone_number, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        const cleanEmail = normalizeEmail(email);
        const existing = await findUserByEmail(cleanEmail);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await createUser({ name, email: cleanEmail, phone_number, password_hash, role: 'traveler' });

        res.status(201).json({ token: signToken(user), user: publicUser(user), profile: null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong during signup.' });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await findUserByEmail(normalizeEmail(email));
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const profile = await loadProfile(user);
        res.status(200).json({ token: signToken(user), user: publicUser(user), profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong during login.' });
    }
}

export async function me(req, res) {
    try {
        const user = await findUserById(req.userId);
        if (!user) return res.status(401).json({ error: 'User no longer exists.' });

        const profile = await loadProfile(user);
        res.status(200).json({ user: publicUser(user), profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong loading your account.' });
    }
}
