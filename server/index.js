import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';

// Force Node.js outbound connections to prefer IPv4 (matching LivePay whitelisted IPv4 69.164.245.17)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import billingRoutes from './routes/billing.js';
import movieRoutes from './routes/movies.js';
import adminRoutes from './routes/admin.js';
import listRoutes from './routes/list.js';
import historyRoutes from './routes/history.js';
import vjRoutes from './routes/vj.js';
import regionRoutes from './routes/regions.js';
import settingsRoutes from './routes/settings.js';
import notificationRoutes from './routes/notifications.js';
import prisma from './db.js';
import bcrypt from 'bcryptjs';

import { catalogMovies } from './seedCatalog.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Express parsers
app.use((req, res, next) => {
  if (req.originalUrl === '/api/billing/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mylist', listRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/vj', vjRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Automatic DB Seeder
async function seedDatabase() {
  try {
    const existingCount = await prisma.movie.count();
    if (existingCount < catalogMovies.length) {
      console.log(`Seeding database with full Ugandan VJ movie catalog (${catalogMovies.length} items)...`);
      for (const m of catalogMovies) {
        const existing = await prisma.movie.findFirst({
          where: { title: m.title, vj: m.vj }
        });
        if (!existing) {
          await prisma.movie.create({ data: m });
        }
      }
      console.log('Database catalog seeding finished successfully!');
    }

    // Seed default active user netflix@test.com / password123
    const defaultUserEmail = 'netflix@test.com';
    const existingUser = await prisma.user.findUnique({
      where: { email: defaultUserEmail }
    });

    if (!existingUser) {
      const passwordHash = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: defaultUserEmail,
          passwordHash,
          role: 'ADMIN',
          plan: 'PREMIUM',
          subscriptionStatus: 'ACTIVE',
          profiles: {
            create: [
              {
                name: 'VJ Fan (Alex)',
                avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80',
                maturityLimit: '18+'
              },
              {
                name: 'Luganda Cinema (Sarah)',
                avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80',
                maturityLimit: '18+'
              },
              {
                name: 'Kids',
                avatarUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&h=150&fit=crop&q=80',
                maturityLimit: '13+'
              }
            ]
          }
        }
      });
      console.log('Default premium test user account seeded successfully!');
    }
  } catch (error) {
    console.error('Seeding database failed:', error);
  }
}

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedDatabase();
});
