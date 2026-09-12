import express from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { reelplexiFetch } from '../services/reelplexi.js';

const router = express.Router();
router.use(authenticateToken);

// List all regions
router.get('/', async (req, res) => {
  try {
    const reelplexiData = await reelplexiFetch('/v1/regions');
    if (reelplexiData && reelplexiData.data) {
      return res.json(reelplexiData);
    }

    const regions = [
      { slug: "east-african", name: "East African (Uganda)", description: "Local Ugandan VJ translations, UG movies & series", countries: ["UG", "KE", "TZ", "RW"] },
      { slug: "kdrama", name: "K-Drama", description: "Korean Drama & Entertainment", countries: ["KR"] },
      { slug: "nollywood", name: "Nollywood", description: "Nigerian & West African Cinema", countries: ["NG", "GH"] },
      { slug: "western", name: "Western / Hollywood", description: "Hollywood & Global Blockbusters", countries: ["US", "GB", "CA"] },
      { slug: "bollywood", name: "Bollywood", description: "Indian Cinema & Action Hits", countries: ["IN"] },
      { slug: "anime", name: "Anime", description: "Japanese Animation & Fantasy", countries: ["JP"] }
    ];

    res.json({ data: regions });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Failed to fetch regions list' });
  }
});

// Get content by region slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const reelplexiData = await reelplexiFetch(`/v1/regions/${slug}`);
    if (reelplexiData && reelplexiData.data) {
      return res.json(reelplexiData);
    }

    const dbMovies = await prisma.movie.findMany({
      where: { region: slug }
    });

    res.json({
      region: { slug, name: slug.toUpperCase() },
      data: dbMovies,
      total: dbMovies.length
    });
  } catch (error) {
    console.error(`Error fetching region content for ${slug}:`, error);
    res.status(500).json({ error: 'Server error fetching region content' });
  }
});

export default router;
