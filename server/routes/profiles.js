import express from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all profiles for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: { userId: req.user.id }
    });
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Server error fetching profiles' });
  }
});

// Create new profile
router.post('/', authenticateToken, async (req, res) => {
  const { name, avatarUrl, maturityLimit } = req.body;

  if (!name || !avatarUrl) {
    return res.status(400).json({ error: 'Profile name and avatar are required' });
  }

  try {
    // Check max profiles limit (e.g. 5)
    const profileCount = await prisma.profile.count({
      where: { userId: req.user.id }
    });

    if (profileCount >= 5) {
      return res.status(400).json({ error: 'Maximum limit of 5 profiles reached' });
    }

    const profile = await prisma.profile.create({
      data: {
        userId: req.user.id,
        name,
        avatarUrl,
        maturityLimit: maturityLimit || '13+'
      }
    });

    res.status(201).json(profile);
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Server error creating profile' });
  }
});

// Update profile details
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, avatarUrl, maturityLimit } = req.body;

  try {
    // Verify profile ownership
    const profile = await prisma.profile.findUnique({
      where: { id }
    });

    if (!profile || profile.userId !== req.user.id) {
      return res.status(404).json({ error: 'Profile not found or unauthorized' });
    }

    const updatedProfile = await prisma.profile.update({
      where: { id },
      data: {
        name: name !== undefined ? name : profile.name,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : profile.avatarUrl,
        maturityLimit: maturityLimit !== undefined ? maturityLimit : profile.maturityLimit
      }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Delete profile
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify profile ownership
    const profile = await prisma.profile.findUnique({
      where: { id }
    });

    if (!profile || profile.userId !== req.user.id) {
      return res.status(404).json({ error: 'Profile not found or unauthorized' });
    }

    await prisma.profile.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ error: 'Server error deleting profile' });
  }
});

export default router;
