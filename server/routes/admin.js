import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getAccountStats, getAccountUsage, getTopAnalytics, getAccountActivity, getApiKey } from '../services/reelplexi.js';

const router = express.Router();

// Apply Admin gate to all endpoints here
router.use(authenticateToken);
router.use(requireAdmin);

// ==========================================
// 1. User Signups & Accounts Management
// ==========================================
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        subscriptionStatus: true,
        createdAt: true,
        profiles: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching user signups list:', error);
    res.status(500).json({ error: 'Server error fetching user signups' });
  }
});

// Delete user account
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }
    if (user.role === 'ADMIN' && (await prisma.user.count({ where: { role: 'ADMIN' } })) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only Admin account' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

// ==========================================
// 2. System Settings & Manual API Key Setup
// ==========================================
router.get('/settings', async (req, res) => {
  try {
    const apiKey = await getApiKey();
    const allSettings = await prisma.systemSetting.findMany();
    const settingsObj = {};
    allSettings.forEach(s => { settingsObj[s.key] = s.value; });

    res.json({
      REELPLEXI_API_KEY: apiKey,
      settings: settingsObj
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.post('/settings', async (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Setting key is required' });
  }

  try {
    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: value || '' },
      create: { key, value: value || '' }
    });

    res.json({ success: true, setting: updated });
  } catch (error) {
    console.error('Error updating system setting:', error);
    res.status(500).json({ error: 'Failed to save system setting' });
  }
});

// Reelplexi API Live Stats & Analytics for Admin
router.get('/reelplexi/stats', async (req, res) => {
  try {
    const stats = await getAccountStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Reelplexi stats' });
  }
});

router.get('/reelplexi/usage', async (req, res) => {
  try {
    const usage = await getAccountUsage(req.query.range || '30d');
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Reelplexi usage' });
  }
});

router.get('/reelplexi/activity', async (req, res) => {
  try {
    const activity = await getAccountActivity(req.query.limit || 10);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Reelplexi activity' });
  }
});

router.get('/reelplexi/top-movies', async (req, res) => {
  try {
    const top = await getTopAnalytics('movies', 10);
    res.json(top);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Reelplexi top movies' });
  }
});

// ==========================================
// 3. Media Ingestion & Catalog Management
// ==========================================
router.get('/movies', async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { title: 'asc' }
    });
    res.json(movies);
  } catch (error) {
    console.error('Error fetching admin movie list:', error);
    res.status(500).json({ error: 'Server error listing movies' });
  }
});

// Add new movie (with VJ & Region support)
router.post('/movies', async (req, res) => {
  const {
    title,
    description,
    thumbnailUrl,
    backdropUrl,
    videoUrl,
    tmdbId,
    duration,
    releaseYear,
    rating,
    genres,
    type,
    category,
    vj,
    originCountry,
    region
  } = req.body;

  if (!title || !description || !thumbnailUrl || !backdropUrl || !videoUrl || !releaseYear || !rating || !genres || !type || !category) {
    return res.status(400).json({ error: 'All primary fields are required to ingest content' });
  }

  try {
    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        thumbnailUrl,
        backdropUrl,
        videoUrl,
        tmdbId: tmdbId || null,
        duration: duration || '2h',
        releaseYear: parseInt(releaseYear, 10),
        rating,
        genres,
        type,
        category,
        vj: vj || 'VJ Junior',
        originCountry: originCountry || 'UG',
        region: region || 'east-african'
      }
    });

    res.status(201).json(movie);
  } catch (error) {
    console.error('Error ingesting movie:', error);
    res.status(500).json({ error: 'Server error adding movie' });
  }
});

// Edit existing movie
router.put('/movies/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    thumbnailUrl,
    backdropUrl,
    videoUrl,
    tmdbId,
    duration,
    releaseYear,
    rating,
    genres,
    type,
    category,
    vj,
    originCountry,
    region
  } = req.body;

  try {
    const movie = await prisma.movie.findUnique({
      where: { id }
    });

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const updatedMovie = await prisma.movie.update({
      where: { id },
      data: {
        title: title !== undefined ? title : movie.title,
        description: description !== undefined ? description : movie.description,
        thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : movie.thumbnailUrl,
        backdropUrl: backdropUrl !== undefined ? backdropUrl : movie.backdropUrl,
        videoUrl: videoUrl !== undefined ? videoUrl : movie.videoUrl,
        tmdbId: tmdbId !== undefined ? (tmdbId || null) : movie.tmdbId,
        duration: duration !== undefined ? duration : movie.duration,
        releaseYear: releaseYear !== undefined ? parseInt(releaseYear, 10) : movie.releaseYear,
        rating: rating !== undefined ? rating : movie.rating,
        genres: genres !== undefined ? genres : movie.genres,
        type: type !== undefined ? type : movie.type,
        category: category !== undefined ? category : movie.category,
        vj: vj !== undefined ? vj : movie.vj,
        originCountry: originCountry !== undefined ? originCountry : movie.originCountry,
        region: region !== undefined ? region : movie.region
      }
    });

    res.json(updatedMovie);
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({ error: 'Server error updating movie' });
  }
});

// Delete movie
router.delete('/movies/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const movie = await prisma.movie.findUnique({
      where: { id }
    });

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    await prisma.movie.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Movie deleted successfully from catalog' });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ error: 'Server error deleting movie' });
  }
});

// ==========================================
// 6. Subscription Package Management
// ==========================================
router.get('/packages', async (req, res) => {
  try {
    let packages = await prisma.package.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // If no packages exist yet, seed default options
    if (packages.length === 0) {
      const defaults = [
        {
          name: 'Daily Pass',
          slug: 'daily-pass',
          price: 2000,
          currency: 'UGX',
          interval: 'DAILY',
          description: 'Full 24-hour access to all VJ Luganda movies and series',
          features: 'Unlimited Streaming, 1 Screen, HD Quality, Luganda Translations',
          resolution: '1080p Full HD',
          screens: 1,
          isActive: true
        },
        {
          name: 'Weekly Special',
          slug: 'weekly-special',
          price: 7000,
          currency: 'UGX',
          interval: 'WEEKLY',
          description: '7 days unlimited streaming access across all devices',
          features: 'Unlimited Streaming, 2 Screens, HD Quality, All VJ Downloads',
          resolution: '1080p Full HD',
          screens: 2,
          isActive: true
        },
        {
          name: 'Monthly VIP',
          slug: 'monthly-vip',
          price: 20000,
          currency: 'UGX',
          interval: 'MONTHLY',
          description: '30 days VIP access with 4K Ultra HD & Multi-Screen',
          features: 'Unlimited Streaming, 4 Screens, 4K Ultra HD, Priority VJ Releases',
          resolution: '4K Ultra HD',
          screens: 4,
          isActive: true
        }
      ];

      for (const item of defaults) {
        await prisma.package.upsert({
          where: { slug: item.slug },
          update: {},
          create: item
        });
      }

      packages = await prisma.package.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(packages);
  } catch (error) {
    console.error('Error fetching admin packages:', error);
    res.status(500).json({ error: 'Server error fetching packages: ' + error.message });
  }
});

router.post('/packages', async (req, res) => {
  const { name, price, currency, interval, description, features, resolution, screens, isActive } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Package name and price are required' });
  }

  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();
    const pkg = await prisma.package.create({
      data: {
        name,
        slug,
        price: parseFloat(price),
        currency: currency || 'UGX',
        interval: interval || 'MONTHLY',
        description: description || '',
        features: features || '',
        resolution: resolution || '1080p Full HD',
        screens: screens ? parseInt(screens, 10) : 2,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    res.status(201).json(pkg);
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Failed to create subscription package' });
  }
});

router.put('/packages/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, currency, interval, description, features, resolution, screens, isActive } = req.body;

  try {
    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const updated = await prisma.package.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        price: price !== undefined ? parseFloat(price) : existing.price,
        currency: currency !== undefined ? currency : existing.currency,
        interval: interval !== undefined ? interval : existing.interval,
        description: description !== undefined ? description : existing.description,
        features: features !== undefined ? features : existing.features,
        resolution: resolution !== undefined ? resolution : existing.resolution,
        screens: screens !== undefined ? parseInt(screens, 10) : existing.screens,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

router.delete('/packages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Package not found' });
    }

    await prisma.package.delete({ where: { id } });
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

export default router;
