import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireSubscription } from '../middleware/auth.js';
import { reelplexiFetch } from '../services/reelplexi.js';

const router = express.Router();

// Apply auth + subscription middleware to all client movie routes
router.use(authenticateToken);
router.use(requireSubscription);

// Get movies grouped by categories/rows with VJ and region support
router.get('/', async (req, res) => {
  const { vj, region, type, latest, trending } = req.query;

  try {
    const whereClause = {};

    if (vj) {
      whereClause.OR = [
        { vj: { contains: vj } },
        { title: { contains: vj } }
      ];
    }
    if (region) {
      whereClause.region = region;
    }
    if (type) {
      whereClause.type = type.toUpperCase();
    }

    const movies = await prisma.movie.findMany({
      where: whereClause,
      orderBy: latest ? { releaseYear: 'desc' } : { id: 'asc' }
    });
    
    // Group movies by category
    const categories = {};
    movies.forEach(movie => {
      const cat = movie.category || 'UG VJ Exclusives';
      if (!categories[cat]) {
        categories[cat] = [];
      }
      categories[cat].push(movie);
    });

    // Ensure we have a featured movie
    const featured = movies.length > 0 ? movies[Math.floor(Math.random() * movies.length)] : null;

    const CATEGORY_ORDER = [
      'UG VJ Exclusives',
      'Trending VJ Movies',
      'Netflix Originals',
      'Top 10 Today',
      'Action & Adventure',
      'K-Drama Hits',
      'Popular on Netflix',
      'Comedies',
      'Documentaries'
    ];

    const sortedCategories = Object.entries(categories)
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => {
        let indexA = CATEGORY_ORDER.indexOf(a.name);
        let indexB = CATEGORY_ORDER.indexOf(b.name);
        if (indexA === -1) indexA = 99;
        if (indexB === -1) indexB = 99;
        return indexA - indexB;
      });

    res.json({
      featured,
      categories: sortedCategories
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Server error fetching movies' });
  }
});

// Universal Search
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Search query parameter q is required' });
  }

  try {
    // Check if Reelplexi API has results first
    const reelplexiSearch = await reelplexiFetch('/v1/search', { q });
    if (reelplexiSearch && reelplexiSearch.data && reelplexiSearch.data.length > 0) {
      return res.json(reelplexiSearch.data);
    }

    const matched = await prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { genres: { contains: q } },
          { vj: { contains: q } },
          { region: { contains: q } }
        ]
      }
    });
    res.json(matched);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error during search' });
  }
});

// Get single movie details with VJ versions
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const movie = await prisma.movie.findUnique({
      where: { id }
    });

    if (!movie) {
      return res.status(404).json({ error: 'Movie or show not found' });
    }

    // Generate available VJ translation versions for this movie
    const available_vj_versions = [
      { id: `${movie.id}_vj1`, vj: movie.vj || 'VJ Junior', title: `${movie.title} (Voiced by ${movie.vj || 'VJ Junior'})` },
      { id: `${movie.id}_vj2`, vj: 'VJ Emmy', title: `${movie.title} (Voiced by VJ Emmy)` },
      { id: `${movie.id}_vj3`, vj: 'VJ Ice P', title: `${movie.title} (Voiced by VJ Ice P)` }
    ];

    // Get recommendations: similar movies in the same genre or VJ
    const firstGenre = movie.genres ? movie.genres.split(',')[0]?.trim() : 'Action';
    const recommendations = await prisma.movie.findMany({
      where: {
        OR: [
          { genres: { contains: firstGenre } },
          { vj: movie.vj }
        ],
        NOT: { id: movie.id }
      },
      take: 6
    });

    res.json({
      movie: {
        ...movie,
        available_vj_versions
      },
      recommendations
    });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ error: 'Server error fetching details' });
  }
});

export default router;
