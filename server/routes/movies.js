import express from 'express';
import prisma from '../db.js';
import { optionalAuth, requireSubscription } from '../middleware/auth.js';
import { reelplexiFetch, getApiKey } from '../services/reelplexi.js';

const router = express.Router();

// Apply auth middleware to client movie routes (allow unsubscribed browsing)
router.use(optionalAuth);

// Official TMDB poster mapping for popular titles
const TMDB_POSTER_MAP = [
  { keywords: ['dune'], poster: 'https://image.tmdb.org/t/p/w500/1pdfLPoLkh9DjhYStB2ERmLFwhC.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/xOMo8WhK81rmXYQtKG9xYvG5nQ9.jpg' },
  { keywords: ['deadpool', 'wolverine'], poster: 'https://image.tmdb.org/t/p/w500/8cdWjhZ2yChPjZUTofhW2Y4cEVM.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/yDHYTfA3R0jFYba16jBB12MStSt.jpg' },
  { keywords: ['godzilla', 'kong'], poster: 'https://image.tmdb.org/t/p/w500/bAV2gIQyU66e63Wv9z2b314e36.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/z121WiqwE72vK4v2p958641.jpg' },
  { keywords: ['furiosa', 'mad max saga'], poster: 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xFiZ8ht.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/wNAhuOZ3Zf84jG3VjEABx9W48PO.jpg' },
  { keywords: ['mad max: fury', 'fury road'], poster: 'https://image.tmdb.org/t/p/w500/8tZYtuYiF9c1h82C5Y87v980.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/nlCHUWldAcxsI1c5y85M1.jpg' },
  { keywords: ['matrix resurrections', 'matrix'], poster: 'https://image.tmdb.org/t/p/w500/8c4a8kE7PjhGTC589GyRm68fYR1.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/hv2Vb0u7c36g57b4461.jpg' },
  { keywords: ['oppenheimer'], poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg' },
  { keywords: ['past lives'], poster: 'https://image.tmdb.org/t/p/w500/k3W1k7W6Y2F7uY8k3j01j0.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/gD9p888.jpg' },
  { keywords: ['kgf'], poster: 'https://image.tmdb.org/t/p/w500/628Dep6AxEtSJj2LVJ7jGvL2Z.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/3w889b.jpg' },
  { keywords: ['rrr'], poster: 'https://image.tmdb.org/t/p/w500/nEuF2avNFMte6uiFTDniqqzC5Wn.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/vI4fD35123.jpg' },
  { keywords: ['gladiator'], poster: 'https://image.tmdb.org/t/p/w500/ty8TTHpM20gE0qX3A1v980.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/9l17548.jpg' },
  { keywords: ['crouching tiger', 'hidden dragon'], poster: 'https://image.tmdb.org/t/p/w500/5mG48M9.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/5mG48M9.jpg' },
  { keywords: ['avatar'], poster: 'https://image.tmdb.org/t/p/w500/t68Gf12g3eX7bB9c14.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/vL5LR6W7Z.jpg' },
  { keywords: ['beekeeper'], poster: 'https://image.tmdb.org/t/p/w500/AfeUz0wzF98.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/AfeUz0wzF98.jpg' },
  { keywords: ['spider-man', 'spider verse'], poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj7sfd8.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/8Vt6mWEReuy4Of61Lnj5Xj7sfd8.jpg' },
  { keywords: ['extraction'], poster: 'https://image.tmdb.org/t/p/w500/7gKI9hpEMcGEpP7y3j.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/7gKI9hpEMcGEpP7y3j.jpg' },
  { keywords: ['john wick'], poster: 'https://image.tmdb.org/t/p/w500/vZloFAK7N9MWwPKT2s.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/vZloFAK7N9MWwPKT2s.jpg' },
  { keywords: ['squid game'], poster: 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNen3GDW.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/dDlEmu3EZ0Pgg93K2SVNen3GDW.jpg' },
  { keywords: ['lovely runner'], poster: 'https://image.tmdb.org/t/p/w500/55n5u4LgG9G03p.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/55n5u4LgG9G03p.jpg' },
  { keywords: ['fast x', 'fast & furious'], poster: 'https://image.tmdb.org/t/p/w500/fiVW06LefBZZTUZG9Yl9Zq.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/fiVW06LefBZZTUZG9Yl9Zq.jpg' },
  { keywords: ['the flash', 'flash'], poster: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctZOSN1YySIySpwo.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/yF1eOkaW1ToDceP1JFUZ45hZQV9.jpg' },
  { keywords: ['batman', 'dark knight'], poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50x9T25uYw.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/74xTEgt7R36Fpooo50x9T25uYw.jpg' }
];

const DIVERSE_FALLBACK_POSTERS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&h=750&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&h=750&fit=crop&q=80'
];

function resolveMovieMedia(item) {
  // 1. Raw API properties check
  let rawPoster = item.poster_url || item.poster_path || item.poster || item.thumbnailUrl || item.thumbnail_url || item.image || item.cover;
  let rawBackdrop = item.backdrop_url || item.backdrop_path || item.backdrop || item.backdropUrl || item.background;

  // Resolve relative TMDB or ReelPlexi paths
  if (rawPoster && typeof rawPoster === 'string') {
    if (rawPoster.startsWith('/storage/') || rawPoster.startsWith('/uploads/')) {
      rawPoster = `https://app.reelplexi.com${rawPoster}`;
    } else if (rawPoster.startsWith('/')) {
      rawPoster = `https://image.tmdb.org/t/p/w500${rawPoster}`;
    } else if (!rawPoster.startsWith('http://') && !rawPoster.startsWith('https://')) {
      rawPoster = `https://app.reelplexi.com/${rawPoster}`;
    }
  }

  if (rawBackdrop && typeof rawBackdrop === 'string') {
    if (rawBackdrop.startsWith('/storage/') || rawBackdrop.startsWith('/uploads/')) {
      rawBackdrop = `https://app.reelplexi.com${rawBackdrop}`;
    } else if (rawBackdrop.startsWith('/')) {
      rawBackdrop = `https://image.tmdb.org/t/p/w1280${rawBackdrop}`;
    } else if (!rawBackdrop.startsWith('http://') && !rawBackdrop.startsWith('https://')) {
      rawBackdrop = `https://app.reelplexi.com/${rawBackdrop}`;
    }
  }

  // 2. Title matching against TMDB poster dictionary
  const title = (item.title || '').toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
  for (const entry of TMDB_POSTER_MAP) {
    if (entry.keywords.some(kw => title.includes(kw))) {
      return {
        poster: rawPoster || entry.poster,
        backdrop: rawBackdrop || entry.backdrop || entry.poster
      };
    }
  }

  // 3. Fallback to hash-based diverse movie posters for items missing poster metadata
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % DIVERSE_FALLBACK_POSTERS.length;
  const fallbackPoster = DIVERSE_FALLBACK_POSTERS[idx];

  return {
    poster: rawPoster || fallbackPoster,
    backdrop: rawBackdrop || rawPoster || fallbackPoster
  };
}

// Helper to map Reelplexi API items to frontend schema
function mapReelplexiItem(item, defaultType = null) {
  const isShow = defaultType === 'SHOW' || item.type === 'series' || item.type === 'SHOW' || item.type === 'tv' || (item.seasons && item.seasons > 0);
  const prefix = isShow ? 'rp_series_' : 'rp_movie_';
  // Derive region from origin country
  const country = (item.origin_country || item.originCountry || 'UG').toUpperCase();
  const regionMap = { KR: 'kdrama', CN: 'kdrama', TW: 'kdrama', JP: 'anime', IN: 'bollywood', NG: 'nollywood', GH: 'nollywood', MX: 'latin', BR: 'latin', TR: 'turkish', PH: 'filipino', TH: 'thai', UG: 'east-african', KE: 'east-african', TZ: 'east-african' };
  const region = item.region || regionMap[country] || 'western';

  const media = resolveMovieMedia(item);

  const seasonsCount = Array.isArray(item.seasons) ? item.seasons.length : (typeof item.seasons === 'number' ? item.seasons : (item.no_of_seasons || 1));

  return {
    id: `${prefix}${item.id}`,
    reelplexiId: item.id,
    title: item.title,
    description: item.overview || item.description || '',
    thumbnailUrl: media.poster,
    backdropUrl: media.backdrop,
    videoUrl: item.remux_url || item.stream_url || item.video_url || item.videoUrl || '',
    embedUrl: item.embed_url || item.embedUrl || '',
    tmdbId: item.tmdb_id ? String(item.tmdb_id) : null,
    duration: isShow ? `${seasonsCount} Season${seasonsCount > 1 ? 's' : ''}` : (item.runtime ? `${item.runtime}m` : '2h'),
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
  const { vj, region, type, latest, trending, page = 1, genre } = req.query;

  try {
    let movies = [];

    if (vj) {
      const moviePages = [1, 2, 3, 4, 5];
      const seriesPages = [1, 2, 3, 4];
      const fetchPromises = [
        ...moviePages.map(p => reelplexiFetch('/movies', { vj, per_page: 100, page: p }).then(res => ({ type: 'MOVIE', res }))),
        ...seriesPages.map(p => reelplexiFetch('/series', { vj, per_page: 100, page: p }).then(res => ({ type: 'SHOW', res })))
      ];
      const results = await Promise.all(fetchPromises.map(p => p.catch(() => null)));
      results.forEach(entry => {
        if (entry && entry.res && Array.isArray(entry.res.data)) {
          entry.res.data.forEach(item => movies.push(mapReelplexiItem(item, entry.type)));
        }
      });
    } else if (genre) {
      // Pass genre directly to Reelplexi so it filters server-side
      const genreParam = { genre, per_page: 100, page };
      const onlyShows = type === 'SHOW';
      const onlyMovies = type === 'MOVIE';
      const fetchList = [];
      if (!onlyShows) fetchList.push(reelplexiFetch('/movies', genreParam).then(r => ({ type: 'MOVIE', res: r })));
      if (!onlyMovies) fetchList.push(reelplexiFetch('/series', genreParam).then(r => ({ type: 'SHOW', res: r })));
      const results = await Promise.all(fetchList.map(p => p.catch(() => null)));
      results.forEach(entry => {
        if (entry?.res && Array.isArray(entry.res.data)) entry.res.data.forEach(item => movies.push(mapReelplexiItem(item, entry.type)));
      });
    } else {
      // Fetch extensive multi-page catalog from Reelplexi API
      const pageNum = parseInt(page, 10) || 1;
      const startMovie = (pageNum - 1) * 3 + 1;
      const moviePages = [startMovie, startMovie + 1, startMovie + 2];
      const startSeries = (pageNum - 1) * 2 + 1;
      const seriesPages = [startSeries, startSeries + 1];

      const fetchPromises = [
        ...moviePages.map(p => reelplexiFetch('/movies', { per_page: 100, page: p }).then(res => ({ type: 'MOVIE', res }))),
        ...seriesPages.map(p => reelplexiFetch('/series', { per_page: 100, page: p }).then(res => ({ type: 'SHOW', res }))),
        reelplexiFetch('/trending', { per_page: 100 }).then(res => ({ type: null, res })),
        reelplexiFetch('/latest', { per_page: 100 }).then(res => ({ type: null, res }))
      ];

      const results = await Promise.all(fetchPromises.map(p => p.catch(() => null)));
      results.forEach(entry => {
        if (entry && entry.res && Array.isArray(entry.res.data)) {
          entry.res.data.forEach(item => movies.push(mapReelplexiItem(item, entry.type)));
        }
      });
    }

    // Always combine with local database movies so no content is ever lost
    const dbMovies = await prisma.movie.findMany({
      orderBy: latest ? { releaseYear: 'desc' } : { id: 'asc' }
    });

    const mappedDbMovies = dbMovies.map(m => {
      const media = resolveMovieMedia(m);
      return {
        ...m,
        thumbnailUrl: media.poster,
        backdropUrl: media.backdrop
      };
    });

    movies = [...movies, ...mappedDbMovies];

    // Deduplicate by item id and title+type
    const seenIds = new Set();
    const seenTitles = new Set();
    movies = movies.filter(m => {
      if (!m.thumbnailUrl) return false;
      const uid = m.id;
      if (seenIds.has(uid)) return false;
      seenIds.add(uid);
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

    if (req.query.genre) {
      const g = req.query.genre.toLowerCase();
      movies = movies.filter(item => item.genres && item.genres.toLowerCase().includes(g));
    }

    // Group movies into rich Genre Categories
    let sortedCategories = [];

    if (vj) {
      const vjCategories = [
        { name: `All ${vj} Catalog (${movies.length} titles)`, match: () => true },
        { name: `Action & Suspense (${vj})`, match: (m) => m.type === 'MOVIE' && /action|adventure|war/i.test(m.genres) },
        { name: `Comedy & Drama (${vj})`, match: (m) => m.type === 'MOVIE' && /comedy|humor|drama|family/i.test(m.genres) },
        { name: `Romance & Thrillers (${vj})`, match: (m) => m.type === 'MOVIE' && /romance|thriller|crime/i.test(m.genres) },
        { name: `TV Series Translated by ${vj}`, match: (m) => m.type === 'SHOW' }
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
      const genreCategories = [
        { name: 'Trending Blockbusters', match: (m) => m.category === 'Trending VJ Movies' || (m.genres && /action|trending|blockbuster/i.test(m.genres)) },
        { name: 'Action & Suspense', match: (m) => m.type === 'MOVIE' && /action|adventure|war/i.test(m.genres) },
        { name: 'Comedy & Entertainment', match: (m) => m.type === 'MOVIE' && /comedy|humor|family|animation/i.test(m.genres) },
        { name: 'Romance & Emotional Dramas', match: (m) => m.type === 'MOVIE' && /romance|romantic|drama/i.test(m.genres) },
        { name: 'Sci-Fi, Superhero & Fantasy', match: (m) => m.type === 'MOVIE' && /sci-fi|fantasy|superhero|science/i.test(m.genres) },
        { name: 'Thrillers, Crime & Mystery', match: (m) => m.type === 'MOVIE' && /thriller|crime|mystery|horror/i.test(m.genres) },
        { name: 'Popular TV Series & Shows', match: (m) => m.type === 'SHOW' },
        { name: 'New & Uncategorised', match: () => true }
      ];

      const catMap = new Map();
      genreCategories.forEach(c => catMap.set(c.name, []));
      const placedIds = new Set();

      for (const cat of genreCategories) {
        const catList = catMap.get(cat.name);
        for (const movie of movies) {
          if (cat.name === 'New & Uncategorised') {
            if (!placedIds.has(movie.id)) {
              catList.push(movie);
            }
          } else if (cat.match(movie)) {
            catList.push(movie);
            placedIds.add(movie.id);
          }
        }
      }

      sortedCategories = Array.from(catMap.entries())
        .map(([name, items]) => ({ name, movies: items }))
        .filter(c => c.movies.length > 0);
    }

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

// Series episodes by season
router.get('/series/:id/season/:season', async (req, res) => {
  const { id, season } = req.params;
  try {
    const data = await reelplexiFetch(`/series/${id}/seasons/${season}/episodes`).catch(() => null)
      || await reelplexiFetch(`/series/${id}/episodes`, { season }).catch(() => null);
    if (data && (Array.isArray(data) || Array.isArray(data.data))) {
      return res.json(Array.isArray(data) ? data : data.data);
    }
    res.json([]);
  } catch (err) {
    res.json([]);
  }
});

// Universal Search via Reelplexi API + Local DB
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Search query parameter q is required' });
  }

  try {
    const results = [];
    const [reelplexiSearch, vjMovies, vjSeries, matchedDb] = await Promise.all([
      reelplexiFetch('/search', { q, per_page: 100 }).catch(() => null),
      reelplexiFetch('/movies', { vj: q, per_page: 100 }).catch(() => null),
      reelplexiFetch('/series', { vj: q, per_page: 100 }).catch(() => null),
      prisma.movie.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { genres: { contains: q, mode: 'insensitive' } },
            { vj: { contains: q, mode: 'insensitive' } }
          ]
        }
      }).catch(() => [])
    ]);

    if (reelplexiSearch && Array.isArray(reelplexiSearch.data)) {
      reelplexiSearch.data.forEach(item => results.push(mapReelplexiItem(item)));
    }
    if (vjMovies && Array.isArray(vjMovies.data)) {
      vjMovies.data.forEach(item => results.push(mapReelplexiItem(item, 'MOVIE')));
    }
    if (vjSeries && Array.isArray(vjSeries.data)) {
      vjSeries.data.forEach(item => results.push(mapReelplexiItem(item, 'SHOW')));
    }
    if (Array.isArray(matchedDb)) {
      matchedDb.forEach(m => {
        const media = resolveMovieMedia(m);
        results.push({ ...m, thumbnailUrl: media.poster, backdropUrl: media.backdrop });
      });
    }

    // Deduplicate search results
    const seenIds = new Set();
    const seenTitles = new Set();
    const deduplicated = results.filter(m => {
      if (!m.id) return false;
      if (seenIds.has(m.id)) return false;
      seenIds.add(m.id);
      const titleKey = `${m.title}__${m.type}`;
      if (seenTitles.has(titleKey)) return false;
      seenTitles.add(titleKey);
      return true;
    });

    res.json(deduplicated);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error during search' });
  }
});

// Get single movie or series details with exact ReelPlexi stream URL
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const isExplicitSeries = id.startsWith('rp_series_');
    const isExplicitMovie = id.startsWith('rp_movie_');

    if (id.startsWith('rp_') || !isNaN(id)) {
      const cleanId = id.replace('rp_movie_', '').replace('rp_series_', '').replace('rp_', '');

      let detailRes = null;
      let isSeries = false;

      if (isExplicitSeries) {
        detailRes = await reelplexiFetch(`/series/${cleanId}`).catch(() => null);
        isSeries = true;
      } else if (isExplicitMovie) {
        detailRes = await reelplexiFetch(`/movies/${cleanId}`).catch(() => null);
        isSeries = false;
      } else {
        // Smart lookup for legacy rp_ IDs: check series first, then movies
        detailRes = await reelplexiFetch(`/series/${cleanId}`).catch(() => null);
        const rawSeries = detailRes?.data || detailRes;
        if (rawSeries && rawSeries.id) {
          isSeries = true;
        } else {
          detailRes = await reelplexiFetch(`/movies/${cleanId}`).catch(() => null);
          isSeries = false;
        }
      }

      const rawDetail = detailRes?.data || detailRes;
      if (rawDetail && rawDetail.id) {
        let streamRes = null;
        if (isSeries) {
          streamRes = await reelplexiFetch(`/series/${cleanId}/seasons/1/episodes/1/stream`).catch(() => null)
            || await reelplexiFetch(`/series/${cleanId}/stream`).catch(() => null);
        } else {
          streamRes = await reelplexiFetch(`/movies/${cleanId}/stream`).catch(() => null);
        }

        const movie = mapReelplexiItem(rawDetail, isSeries ? 'SHOW' : 'MOVIE');
        if (streamRes) {
          // Prioritize stream_url over remux_url (which returns 404 on ReelPlexi API)
          movie.videoUrl = streamRes.stream_url || streamRes.video_url || streamRes.remux_url || movie.videoUrl;
          const apiKey = process.env.REELPLEXI_API_KEY || (await prisma.systemSetting.findUnique({ where: { key: 'REELPLEXI_API_KEY' } }))?.value;
          movie.embedUrl = isSeries 
            ? `https://api.reelplexi.com/v1/embed/tv/${cleanId}/1/1?api_key=${apiKey || ''}`
            : `https://api.reelplexi.com/v1/embed/movie/${cleanId}?api_key=${apiKey || ''}`;
        }
        return res.json({ movie, recommendations: [] });
      }
    }

    const movie = await prisma.movie.findUnique({ where: { id } });
    if (!movie) {
      return res.status(404).json({ error: 'Movie or show not found' });
    }

    res.json({ movie, recommendations: [] });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ error: 'Server error fetching details' });
  }
});

export default router;
