import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireSubscription } from '../middleware/auth.js';
import { reelplexiFetch } from '../services/reelplexi.js';

const router = express.Router();

// Apply auth middleware to client movie routes (allow unsubscribed browsing)
router.use(authenticateToken);

// Helper to map Reelplexi API items to frontend schema
function mapReelplexiItem(item) {
  const isShow = item.type === 'series' || item.type === 'SHOW';
  // Derive region from origin country
  const country = (item.origin_country || item.originCountry || 'UG').toUpperCase();
  const regionMap = { KR: 'kdrama', CN: 'kdrama', TW: 'kdrama', JP: 'anime', IN: 'bollywood', NG: 'nollywood', GH: 'nollywood', MX: 'latin', BR: 'latin', TR: 'turkish', PH: 'filipino', TH: 'thai', UG: 'east-african', KE: 'east-african', TZ: 'east-african' };
  const region = item.region || regionMap[country] || 'western';
  return {
    id: `rp_${item.id}`,
    reelplexiId: item.id,
    title: item.title,
    description: item.overview || item.description || '',
    thumbnailUrl: item.poster_url || item.thumbnailUrl || null,
    backdropUrl: item.backdrop_url || item.poster_url || item.backdropUrl || null,
    videoUrl: item.stream_url || item.video_url || item.videoUrl || '',
    embedUrl: item.embed_url || item.embedUrl || '',
    tmdbId: item.tmdb_id ? String(item.tmdb_id) : null,
    duration: isShow ? (item.seasons ? `${item.seasons} Season${item.seasons > 1 ? 's' : ''}` : 'Series') : (item.runtime ? `${item.runtime}m` : '2h'),
    releaseYear: item.release_date ? parseInt(item.release_date.split('-')[0], 10) : (item.releaseYear || 2024),
    rating: item.rating || item.content_rating || 'PG-13',
    genres: Array.isArray(item.genres) ? item.genres.join(', ') : (item.genres || ''),
    type: isShow ? 'SHOW' : 'MOVIE',
    category: item.category || (isShow ? 'Popular TV Series & Shows' : 'Ugandan VJ Exclusives'),
    vj: item.vj || '',
    originCountry: country,
    region
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

    // Always combine with local database movies so no content is ever lost
    const dbMovies = await prisma.movie.findMany({
      orderBy: latest ? { releaseYear: 'desc' } : { id: 'asc' }
    });
    movies = [...movies, ...dbMovies];

    // Deduplicate by reelplexiId (or id for DB items), then filter out items with no poster
    const seenIds = new Set();
    const seenTitles = new Set();
    movies = movies.filter(m => {
      if (!m.thumbnailUrl) return false; // drop items with no poster image
      const uid = m.reelplexiId || m.id;
      if (seenIds.has(uid)) return false;
      seenIds.add(uid);
      // Also deduplicate by title+type to avoid same movie from movies+trending endpoints
      const titleKey = `${m.title}__${m.type}`;
      if (seenTitles.has(titleKey)) return false;
      seenTitles.add(titleKey);
      return true;
    });

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

    // Group movies into rich Genre Categories (Comedy, Romance, Action, Sci-Fi, Thrillers, Series)
    let sortedCategories = [];

    if (vj) {
      // When a specific VJ is selected, group by Action, Comedy, Drama, Series for that VJ
      const vjCategories = [
        { name: `Action & Suspense (${vj})`, match: (m) => m.type === 'MOVIE' && /action|adventure|war/i.test(m.genres) },
        { name: `Comedy & Drama (${vj})`, match: (m) => m.type === 'MOVIE' && /comedy|humor|drama|family/i.test(m.genres) },
        { name: `Romance & Thrillers (${vj})`, match: (m) => m.type === 'MOVIE' && /romance|thriller|crime/i.test(m.genres) },
        { name: `TV Series Translated by ${vj}`, match: (m) => m.type === 'SHOW' },
        { name: `All Movies by ${vj}`, match: () => true }
      ];

      const vjCatMap = new Map();
      vjCategories.forEach(c => vjCatMap.set(c.name, []));

      movies.forEach(m => {
        for (const cat of vjCategories) {
          if (cat.match(m)) {
            vjCatMap.get(cat.name).push(m);
          }
        }
      });

      sortedCategories = Array.from(vjCatMap.entries())
        .map(([name, items]) => ({ name, movies: items }))
        .filter(c => c.movies.length > 0);
    } else {
      // Main Screen: Group by Genres (Action, Comedy, Romance, Sci-Fi, Thrillers, Series, Trending)
      const genreCategories = [
        { name: 'Trending Blockbusters', match: (m) => m.category === 'Trending VJ Movies' || (m.genres && /action|trending|blockbuster/i.test(m.genres)) },
        { name: 'Action & Suspense', match: (m) => m.type === 'MOVIE' && /action|adventure|war/i.test(m.genres) },
        { name: 'Comedy & Entertainment', match: (m) => m.type === 'MOVIE' && /comedy|humor|family|animation/i.test(m.genres) },
        { name: 'Romance & Emotional Dramas', match: (m) => m.type === 'MOVIE' && /romance|romantic|drama/i.test(m.genres) },
        { name: 'Sci-Fi, Superhero & Fantasy', match: (m) => m.type === 'MOVIE' && /sci-fi|fantasy|superhero|science/i.test(m.genres) },
        { name: 'Thrillers, Crime & Mystery', match: (m) => m.type === 'MOVIE' && /thriller|crime|mystery|horror/i.test(m.genres) },
        { name: 'Popular TV Series & Shows', match: (m) => m.type === 'SHOW' },
        { name: 'Ugandan VJ Exclusives', match: () => true }
      ];

      const catMap = new Map();
      genreCategories.forEach(c => catMap.set(c.name, []));
      const seenMovieIdsPerCategory = new Map();

      movies.forEach(movie => {
        for (const cat of genreCategories) {
          const list = catMap.get(cat.name);
          const seen = seenMovieIdsPerCategory.get(cat.name) || new Set();
          if (cat.match(movie) && !seen.has(movie.id) && list.length < 30) {
            list.push(movie);
            seen.add(movie.id);
            seenMovieIdsPerCategory.set(cat.name, seen);
          }
        }
      });

      sortedCategories = Array.from(catMap.entries())
        .map(([name, items]) => ({ name, movies: items }))
        .filter(c => c.movies.length > 0);
    }

    // Ensure we have a featured movie for Hero Banner
    const featured = movies.length > 0 ? movies[Math.floor(Math.random() * movies.length)] : null;

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

      // Try movie first, then series
      let detailRes = await reelplexiFetch(`/movies/${cleanId}`).catch(() => null);
      let isSeries = false;
      if (!detailRes || (!detailRes.id && !detailRes.data)) {
        detailRes = await reelplexiFetch(`/series/${cleanId}`).catch(() => null);
        isSeries = true;
      }

      const streamRes = await reelplexiFetch(`/${isSeries ? 'series' : 'movies'}/${cleanId}/stream`).catch(() => null)
        || await reelplexiFetch(`/stream/${isSeries ? 'tv' : 'movie'}/${cleanId}`).catch(() => null);

      const rawDetail = detailRes?.data || detailRes;
      if (rawDetail && rawDetail.id) {
        const movie = mapReelplexiItem(rawDetail);
        if (streamRes) {
          movie.videoUrl = streamRes.stream_url || streamRes.video_url || streamRes.remux_url || movie.videoUrl;
          movie.embedUrl = streamRes.embed_url || movie.embedUrl;
        }
        const available_vj_versions = [
          { id: `${movie.id}_vj1`, vj: movie.vj || 'VJ Junior' },
          { id: `${movie.id}_vj2`, vj: 'VJ Emmy' },
          { id: `${movie.id}_vj3`, vj: 'VJ Ice P' }
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
