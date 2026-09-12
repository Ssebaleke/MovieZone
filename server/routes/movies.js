import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireSubscription } from '../middleware/auth.js';
import { reelplexiFetch } from '../services/reelplexi.js';

const router = express.Router();

// Apply auth + subscription middleware to all client movie routes
router.use(authenticateToken);
router.use(requireSubscription);

// Helper to map Reelplexi API items to frontend schema
function mapReelplexiItem(item) {
  const isShow = item.type === 'series' || item.type === 'SHOW';
  return {
    id: `rp_${item.id}`,
    reelplexiId: item.id,
    title: item.title,
    description: item.overview || item.description || `Translated in Luganda by ${item.vj || 'Ugandan VJ'}`,
    thumbnailUrl: item.poster_url || item.thumbnailUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=300&fit=crop&q=80',
    backdropUrl: item.backdrop_url || item.poster_url || item.backdropUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=600&fit=crop&q=80',
    videoUrl: item.stream_url || item.video_url || item.videoUrl || 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    tmdbId: item.tmdb_id ? String(item.tmdb_id) : null,
    duration: isShow ? 'Series' : '2h 15m',
    releaseYear: item.release_date ? parseInt(item.release_date.split('-')[0], 10) : 2024,
    rating: item.rating || 'PG-13',
    genres: Array.isArray(item.genres) ? item.genres.join(', ') : (item.genres || 'Action, Drama'),
    type: isShow ? 'SHOW' : 'MOVIE',
    category: isShow ? 'Reelplexi Series Feed' : (item.vj ? 'Ugandan VJ Exclusives' : 'Reelplexi Movies Feed'),
    vj: item.vj || 'VJ Junior',
    originCountry: 'UG',
    region: isShow ? 'kdrama' : 'east-african'
  };
}

// Get full movies/series catalog grouped by categories (100% Reelplexi.com API)
router.get('/', async (req, res) => {
  const { vj, region, type, latest, trending, page = 1 } = req.query;

  try {
    let movies = [];

    if (vj) {
      // Direct VJ filter query on Reelplexi API
      const [vjMoviesRes, vjSeriesRes] = await Promise.all([
        reelplexiFetch('/movies', { vj, per_page: 100, page }),
        reelplexiFetch('/series', { vj, per_page: 100, page })
      ]);

      if (vjMoviesRes && Array.isArray(vjMoviesRes.data)) {
        vjMoviesRes.data.forEach(item => movies.push(mapReelplexiItem(item)));
      }
      if (vjSeriesRes && Array.isArray(vjSeriesRes.data)) {
        vjSeriesRes.data.forEach(item => movies.push(mapReelplexiItem(item)));
      }
    } else {
      // Fetch multi-page catalog from Reelplexi API (optimized to 4 parallel calls for speed & stability)
      const [
        liveMoviesP1, liveMoviesP2,
        liveSeriesP1,
        trendingRes
      ] = await Promise.all([
        reelplexiFetch('/movies', { per_page: 100, page: 1 }),
        reelplexiFetch('/movies', { per_page: 100, page: 2 }),
        reelplexiFetch('/series', { per_page: 100, page: 1 }),
        reelplexiFetch('/trending', { per_page: 100 })
      ]);

      [liveMoviesP1, liveMoviesP2].forEach(res => {
        if (res && Array.isArray(res.data)) {
          res.data.forEach(item => movies.push(mapReelplexiItem(item)));
        }
      });

      if (liveSeriesP1 && Array.isArray(liveSeriesP1.data)) {
        liveSeriesP1.data.forEach(item => movies.push(mapReelplexiItem(item)));
      }

      if (trendingRes && Array.isArray(trendingRes.data)) {
        trendingRes.data.forEach(item => {
          const mapped = mapReelplexiItem(item);
          mapped.category = 'Trending VJ Movies';
          movies.push(mapped);
        });
      }
    }

    // Fallback to SQLite DB if Reelplexi key is unconfigured or offline
    if (movies.length === 0) {
      const dbMovies = await prisma.movie.findMany({
        orderBy: latest ? { releaseYear: 'desc' } : { id: 'asc' }
      });
      movies = dbMovies;
    }

    // Deduplicate by ID
    const uniqueMap = new Map();
    movies.forEach(m => uniqueMap.set(m.id, m));
    movies = Array.from(uniqueMap.values());

    // Apply client-side filters if specified
    if (vj) {
      movies = movies.filter(item => 
        (item.vj && item.vj.toLowerCase().includes(vj.toLowerCase())) || 
        item.title.toLowerCase().includes(vj.toLowerCase())
      );
    }

    if (region) {
      movies = movies.filter(item => item.region === region);
    }

    if (type) {
      movies = movies.filter(item => item.type === type.toUpperCase());
    }

    // Group movies by category
    const categories = {};
    movies.forEach(movie => {
      let cat = movie.category || 'Ugandan VJ Exclusives';
      if (movie.vj) {
        cat = `Translated by ${movie.vj}`;
      } else if (movie.type === 'SHOW') {
        cat = 'Reelplexi Series Feed';
      }
      if (!categories[cat]) {
        categories[cat] = [];
      }
      categories[cat].push(movie);
    });

    // Ensure we have a featured movie
    const featured = movies.length > 0 ? movies[Math.floor(Math.random() * movies.length)] : null;

    const sortedCategories = Object.entries(categories)
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => b.items.length - a.items.length);

    res.json({
      featured,
      categories: sortedCategories,
      total_items: movies.length
    });
  } catch (error) {
    console.error('Error fetching Reelplexi catalog:', error);
    res.status(500).json({ error: 'Server error fetching Reelplexi catalog' });
  }
});

// Universal Search via Reelplexi API
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Search query parameter q is required' });
  }

  try {
    const reelplexiSearch = await reelplexiFetch('/search', { q, per_page: 50 });
    if (reelplexiSearch && Array.isArray(reelplexiSearch.data)) {
      return res.json(reelplexiSearch.data.map(mapReelplexiItem));
    }

    const matched = await prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { genres: { contains: q } },
          { vj: { contains: q } }
        ]
      }
    });
    res.json(matched);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error during search' });
  }
});

// Get single movie details with direct ReelPlexi video stream URL
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (id.startsWith('rp_') || !isNaN(id)) {
      const cleanId = id.replace('rp_movie_', '').replace('rp_series_', '').replace('rp_', '');
      
      const [detailRes, streamRes] = await Promise.all([
        reelplexiFetch(`/movies/${cleanId}`).catch(() => null) || reelplexiFetch(`/series/${cleanId}`).catch(() => null),
        reelplexiFetch(`/movies/${cleanId}/stream`).catch(() => null)
      ]);

      const rawDetail = detailRes?.data || detailRes;
      if (rawDetail) {
        const movie = mapReelplexiItem(rawDetail);
        if (streamRes) {
          movie.videoUrl = streamRes.stream_url || streamRes.video_url || streamRes.remux_url || movie.videoUrl;
          movie.embedUrl = streamRes.embed_url || movie.embedUrl;
          movie.isMkv = streamRes.is_mkv;
          movie.format = streamRes.format;
        }

        const available_vj_versions = [
          { id: `${movie.id}_vj1`, vj: movie.vj || 'VJ Junior', title: `${movie.title} (Voiced by ${movie.vj || 'VJ Junior'})` },
          { id: `${movie.id}_vj2`, vj: 'VJ Emmy', title: `${movie.title} (Voiced by VJ Emmy)` },
          { id: `${movie.id}_vj3`, vj: 'VJ Ice P', title: `${movie.title} (Voiced by VJ Ice P)` }
        ];
        return res.json({ movie: { ...movie, available_vj_versions }, recommendations: [] });
      }
    }

    const movie = await prisma.movie.findUnique({ where: { id } });
    if (!movie) {
      return res.status(404).json({ error: 'Movie or show not found' });
    }

    const available_vj_versions = [
      { id: `${movie.id}_vj1`, vj: movie.vj || 'VJ Junior', title: `${movie.title} (Voiced by ${movie.vj || 'VJ Junior'})` },
      { id: `${movie.id}_vj2`, vj: 'VJ Emmy', title: `${movie.title} (Voiced by VJ Emmy)` },
      { id: `${movie.id}_vj3`, vj: 'VJ Ice P', title: `${movie.title} (Voiced by VJ Ice P)` }
    ];

    res.json({ movie: { ...movie, available_vj_versions }, recommendations: [] });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ error: 'Server error fetching details' });
  }
});

export default router;
