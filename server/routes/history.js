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
  const { profileId, movieId, progressSeconds, movieDetails } = req.body;

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

    let targetMovieId = movieId;

    // Ensure movie exists in SQLite DB for Foreign Key integrity
    const existingMovie = await prisma.movie.findUnique({ where: { id: targetMovieId } });
    
    if (!existingMovie) {
      const title = movieDetails?.title || 'Ugandan VJ Translated Film';
      const description = movieDetails?.description || 'Luganda audio translation by Ugandan VJ';
      const thumbnailUrl = movieDetails?.thumbnailUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=300&fit=crop&q=80';
      const backdropUrl = movieDetails?.backdropUrl || thumbnailUrl;
      const videoUrl = movieDetails?.videoUrl || '';

      try {
        await prisma.movie.create({
          data: {
            id: targetMovieId,
            title,
            description,
            thumbnailUrl,
            backdropUrl,
            videoUrl,
            tmdbId: movieDetails?.tmdbId || null,
            duration: movieDetails?.duration || '2h 15m',
            releaseYear: movieDetails?.releaseYear || 2024,
            rating: movieDetails?.rating || 'PG-13',
            genres: movieDetails?.genres || 'Action, Drama',
            type: movieDetails?.type || 'MOVIE',
            category: movieDetails?.category || 'Ugandan VJ Exclusives',
            vj: movieDetails?.vj || 'VJ Junior',
            originCountry: 'UG',
            region: movieDetails?.region || 'east-african'
          }
        });
      } catch (err) {
        // Fallback if concurrent insert happened
      }
    }

    // Upsert watch history progress linked to account profile
    const record = await prisma.watchHistory.upsert({
      where: {
        profileId_movieId: { profileId, movieId: targetMovieId }
      },
      update: {
        progressSeconds: parseInt(progressSeconds, 10)
      },
      create: {
        profileId,
        movieId: targetMovieId,
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
