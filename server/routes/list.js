import express from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all endpoints
router.use(authenticateToken);

// Get list items for a profile
router.get('/:profileId', async (req, res) => {
  const { profileId } = req.params;

  try {
    // Verify profile ownership
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    });

    if (!profile || profile.userId !== req.user.id) {
      return res.status(404).json({ error: 'Profile not found or unauthorized' });
    }

    const myList = await prisma.myList.findMany({
      where: { profileId },
      include: {
        movie: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Return the movie objects directly
    res.json(myList.map(item => item.movie));
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Server error fetching watchlist' });
  }
});

// Add movie to profile list
router.post('/', async (req, res) => {
  const { profileId, movieId } = req.body;

  if (!profileId || !movieId) {
    return res.status(400).json({ error: 'profileId and movieId are required' });
  }

  try {
    // Verify profile ownership
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    });

    if (!profile || profile.userId !== req.user.id) {
      return res.status(404).json({ error: 'Profile not found or unauthorized' });
    }

    // Check if item already in list
    const existing = await prisma.myList.findUnique({
      where: {
        profileId_movieId: { profileId, movieId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Movie is already in list' });
    }

    const newItem = await prisma.myList.create({
      data: {
        profileId,
        movieId
      },
      include: {
        movie: true
      }
    });

    res.status(201).json(newItem.movie);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ error: 'Server error adding to watchlist' });
  }
});

// Remove movie from profile list
router.delete('/', async (req, res) => {
  const { profileId, movieId } = req.body;

  if (!profileId || !movieId) {
    return res.status(400).json({ error: 'profileId and movieId are required' });
  }

  try {
    // Verify profile ownership
    const profile = await prisma.profile.findUnique({
      where: { id: profileId }
    });

    if (!profile || profile.userId !== req.user.id) {
      return res.status(404).json({ error: 'Profile not found or unauthorized' });
    }

    await prisma.myList.delete({
      where: {
        profileId_movieId: { profileId, movieId }
      }
    });

    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ error: 'Server error removing from watchlist' });
  }
});

export default router;
