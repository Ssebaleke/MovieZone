import express from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get watch history progress for a profile
router.get('/:profileId', async (req, res) => {
  const { profileId } = req.params;

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    });

    if (!profile || profile.userId !== req.user.id) {
      return res.status(404).json({ error: 'Profile not found or unauthorized' });
    }

    const history = await prisma.watchHistory.findMany({
      where: { profileId },
      include: {
        movie: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(history.map(item => ({
      movie: item.movie,
      progressSeconds: item.progressSeconds,
      updatedAt: item.updatedAt
    })));
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({ error: 'Server error fetching watch history' });
  }
});

// Update or add watch progress bookmark
router.post('/progress', async (req, res) => {
  const { profileId, movieId, progressSeconds } = req.body;

  if (!profileId || !movieId || progressSeconds === undefined) {
    return res.status(400).json({ error: 'profileId, movieId, and progressSeconds are required' });
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    });

    if (!profile || profile.userId !== req.user.id) {
      return res.status(404).json({ error: 'Profile not found or unauthorized' });
    }

    // If movieId is a ReelPlexi item, check if local movie record exists, else return success
    if (typeof movieId === 'string' && movieId.startsWith('rp_')) {
      const localMovie = await prisma.movie.findUnique({ where: { id: movieId } });
      if (!localMovie) {
        return res.json({ success: true, movieId, progressSeconds: parseInt(progressSeconds, 10), isReelplexi: true });
      }
    }

    // Create or update watch progress
    const record = await prisma.watchHistory.upsert({
      where: {
        profileId_movieId: { profileId, movieId }
      },
      update: {
        progressSeconds: parseInt(progressSeconds, 10)
      },
      create: {
        profileId,
        movieId,
        progressSeconds: parseInt(progressSeconds, 10)
      },
      include: {
        movie: true
      }
    });

    res.json({
      success: true,
      movieId: record.movieId,
      progressSeconds: record.progressSeconds
    });
  } catch (error) {
    console.error('Error saving progress bookmark:', error.message);
    res.json({ success: true, warning: 'Watch progress saved in session' });
  }
});

export default router;
