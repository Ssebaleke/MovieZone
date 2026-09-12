import express from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { reelplexiFetch } from '../services/reelplexi.js';

const router = express.Router();
router.use(authenticateToken);

// List all VJ translators
router.get('/', async (req, res) => {
  try {
    // Check if Reelplexi API has live VJ list
    const reelplexiData = await reelplexiFetch('/v1/vj');
    if (reelplexiData && reelplexiData.data) {
      return res.json(reelplexiData);
    }

    // Local / Default Ugandan VJs catalog
    const vjs = [
      { id: 1, name: "VJ Junior", title: "The Master of Action & Suspense", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80", bio: "Uganda's legendary Video Joker famous for high-energy Luganda translations of Hollywood blockbusters." },
      { id: 2, name: "VJ Emmy", title: "The Romance & Drama Specialist", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80", bio: "Known for expressive voice acting across romantic dramas, series, and emotional thrillers." },
      { id: 3, name: "VJ Ice P", title: "The Sci-Fi & Anime King", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80", bio: "Specialist in action, superhero, and Asian cinema Luganda narration." },
      { id: 4, name: "VJ Jingo", title: "The Comedy & Classics Veteran", avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&q=80", bio: "Pioneer of Ugandan VJ culture, bringing hilarious commentary to action and classic cinema." },
      { id: 5, name: "VJ Mark", title: "The K-Drama & Series Guru", avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&q=80", bio: "Top choice for Korean dramas, Turkish series, and fast-paced thrillers." }
    ];

    res.json({ data: vjs, total: vjs.length });
  } catch (error) {
    console.error('Error fetching VJs list:', error);
    res.status(500).json({ error: 'Failed to fetch VJ list' });
  }
});

// Get movies/series translated by a specific VJ
router.get('/:name/movies', async (req, res) => {
  const { name } = req.params;
  try {
    const reelplexiData = await reelplexiFetch(`/v1/vj/${encodeURIComponent(name)}/movies`);
    if (reelplexiData && reelplexiData.data) {
      return res.json(reelplexiData);
    }

    const dbMovies = await prisma.movie.findMany({
      where: {
        OR: [
          { vj: { contains: name } },
          { title: { contains: name } }
        ]
      }
    });

    res.json({ data: dbMovies, total: dbMovies.length });
  } catch (error) {
    console.error(`Error fetching movies for VJ ${name}:`, error);
    res.status(500).json({ error: 'Server error fetching VJ movies' });
  }
});

export default router;
