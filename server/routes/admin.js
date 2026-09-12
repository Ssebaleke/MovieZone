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

export default router;
