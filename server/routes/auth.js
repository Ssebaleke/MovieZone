import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Make the very first user or designated admin emails an ADMIN, others USER
    const userCount = await prisma.user.count();
    const isFirstOrAdmin = userCount === 0 || email.toLowerCase().includes('admin') || email.toLowerCase().includes('jsvico100') || email.toLowerCase().includes('ahmedmutumba');
    const role = isFirstOrAdmin ? 'ADMIN' : 'USER';

    // Admin users get ACTIVE by default, regular users start INACTIVE
    const plan = role === 'ADMIN' ? 'PREMIUM' : 'NONE';
    const subscriptionStatus = role === 'ADMIN' ? 'ACTIVE' : 'INACTIVE';

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        role,
        plan,
        subscriptionStatus
      }
    });

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'netflix_clone_jwt_secret_key_12345!',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server registration error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'netflix_clone_jwt_secret_key_12345!',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server login error' });
  }
});

// Get current user details — auto-expire subscription if past subscriptionEnd
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Auto-expire if subscriptionEnd has passed
    if (
      user.subscriptionStatus === 'ACTIVE' &&
      user.role !== 'ADMIN' &&
      user.subscriptionEnd &&
      new Date(user.subscriptionEnd) < new Date()
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: 'INACTIVE', plan: 'NONE' }
      });
      user.subscriptionStatus = 'INACTIVE';
      user.plan = 'NONE';
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEnd: user.subscriptionEnd
      }
    });
  } catch (err) {
    console.error('Error in /me:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
