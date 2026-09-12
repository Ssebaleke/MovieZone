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

    let movies = await prisma.movie.findMany({
      where: whereClause,
      orderBy: latest ? { releaseYear: 'desc' } : { id: 'asc' }
    });
    
    // Attempt live fetch from Reelplexi API
    try {
      const liveMoviesRes = await reelplexiFetch('/movies');
      const liveSeriesRes = await reelplexiFetch('/series');
      
      const liveItems = [];
      if (liveMoviesRes && Array.isArray(liveMoviesRes.data)) {
        liveMoviesRes.data.forEach(item => {
          liveItems.push({
            id: `rp_movie_${item.id}`,
            title: item.title,
            description: item.overview || `Exclusive Ugandan VJ translation by ${item.vj || 'VJ Junior'}`,
            thumbnailUrl: item.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=300&fit=crop&q=80',
            backdropUrl: item.backdrop_url || item.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=600&fit=crop&q=80',
            videoUrl: item.stream_url || 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
            tmdbId: item.tmdb_id ? String(item.tmdb_id) : null,
            duration: '2h 10m',
            releaseYear: item.release_date ? parseInt(item.release_date.split('-')[0], 10) : 2024,
            rating: 'PG-13',
            genres: Array.isArray(item.genres) ? item.genres.join(', ') : (item.genres || 'Action, Drama'),
            type: 'MOVIE',
            category: 'Reelplexi VJ Live Feed',
            vj: item.vj || 'VJ Junior',
            originCountry: 'UG',
            region: 'east-african'
          });
        });
      }

      if (liveSeriesRes && Array.isArray(liveSeriesRes.data)) {
        liveSeriesRes.data.forEach(item => {
          liveItems.push({
            id: `rp_series_${item.id}`,
            title: item.title,
            description: item.overview || `Hit VJ Translated Series by ${item.vj || 'VJ Emmy'}`,
            thumbnailUrl: item.poster_url || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&h=300&fit=crop&q=80',
            backdropUrl: item.backdrop_url || item.poster_url || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&h=600&fit=crop&q=80',
            videoUrl: item.stream_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            tmdbId: item.tmdb_id ? String(item.tmdb_id) : null,
            duration: '12 Episodes',
            releaseYear: item.release_date ? parseInt(item.release_date.split('-')[0], 10) : 2024,
            rating: 'TV-14',
            genres: Array.isArray(item.genres) ? item.genres.join(', ') : (item.genres || 'Drama'),
            type: 'SHOW',
            category: 'Reelplexi Series Feed',
            vj: item.vj || 'VJ Emmy',
            originCountry: 'UG',
            region: 'kdrama'
          });
        });
      }

      if (liveItems.length > 0) {
        // Filter live items if VJ or Region query is provided
        let filteredLive = liveItems;
        if (vj) {
          filteredLive = filteredLive.filter(item => item.vj.toLowerCase().includes(vj.toLowerCase()) || item.title.toLowerCase().includes(vj.toLowerCase()));
        }
        if (region) {
          filteredLive = filteredLive.filter(item => item.region === region);
        }
        if (type) {
          filteredLive = filteredLive.filter(item => item.type === type.toUpperCase());
        }
        movies = [...filteredLive, ...movies];
      }
    } catch (e) {
      console.warn('Reelplexi live merge fallback to local DB:', e.message);
    }
    
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
      'Reelplexi VJ Live Feed',
      'Reelplexi Series Feed',
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
