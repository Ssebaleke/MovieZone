import jwt from 'jsonwebtoken';
import prisma from '../db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'netflix_clone_jwt_secret_key_12345!');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(403).json({ error: 'User not found or deleted' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireSubscription = (req, res, next) => {
  // Allow admins to browse freely
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  
  if (!req.user || req.user.subscriptionStatus !== 'ACTIVE') {
    return res.status(403).json({ 
      error: 'Active subscription required', 
      subscriptionRequired: true 
    });
  }
  next();
};
