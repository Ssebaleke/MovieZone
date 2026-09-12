import express from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { reelplexiFetch } from '../services/reelplexi.js';

const router = express.Router();
router.use(authenticateToken);

// List all VJ translators dynamically from Reelplexi API
router.get('/', async (req, res) => {
  try {
    const reelplexiData = await reelplexiFetch('/vj', { per_page: 100 });
    if (reelplexiData && Array.isArray(reelplexiData.data)) {
      const vjs = reelplexiData.data.map(vj => {
        const rawName = vj.name || 'VJ';
        const formattedName = rawName.toUpperCase().startsWith('VJ') ? rawName : `VJ ${rawName}`;
        return {
          id: vj.id,
          name: formattedName,
          rawName: rawName,
          title: 'Official Ugandan VJ Translator',
          avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80`,
          bio: `Professional Ugandan VJ bringing high-energy Luganda audio translation to international cinema.`
        };
      });
      return res.json({ data: vjs, total: vjs.length });
    }

    // Default Ugandan VJs catalog fallback
    const defaultVjs = [
      { id: 1, name: "VJ Junior", title: "The Master of Action & Suspense", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80", bio: "Uganda's legendary Video Joker famous for high-energy Luganda translations." },
      { id: 2, name: "VJ Emmy", title: "The Romance & Drama Specialist", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80", bio: "Known for expressive voice acting across romantic dramas and series." },
      { id: 3, name: "VJ Ice P", title: "The Sci-Fi & Anime King", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80", bio: "Specialist in action, superhero, and Asian cinema Luganda narration." },
      { id: 4, name: "VJ Jingo", title: "The Comedy & Classics Veteran", avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&q=80", bio: "Pioneer of Ugandan VJ culture." },
      { id: 5, name: "VJ Mark", title: "The K-Drama & Series Guru", avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&q=80", bio: "Top choice for Korean dramas and Turkish series." }
    ];

    res.json({ data: defaultVjs, total: defaultVjs.length });
  } catch (error) {
    console.error('Error fetching VJs list:', error);
    res.status(500).json({ error: 'Failed to fetch VJ list' });
  }
});

// Get movies/series translated by a specific VJ from Reelplexi API
router.get('/:name/movies', async (req, res) => {
  const { name } = req.params;
  try {
    const [moviesRes, seriesRes] = await Promise.all([
      reelplexiFetch('/movies', { vj: name, per_page: 100 }),
      reelplexiFetch('/series', { vj: name, per_page: 100 })
    ]);

    const results = [];

    if (moviesRes && Array.isArray(moviesRes.data)) {
      moviesRes.data.forEach(item => {
        results.push({
          id: `rp_${item.id}`,
          reelplexiId: item.id,
          title: item.title,
          description: item.overview || `Voiced in Luganda by ${item.vj || name}`,
          thumbnailUrl: item.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=300&fit=crop&q=80',
          backdropUrl: item.backdrop_url || item.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=600&fit=crop&q=80',
          videoUrl: item.stream_url || 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
          duration: '2h 10m',
          releaseYear: item.release_date ? parseInt(item.release_date.split('-')[0], 10) : 2024,
          rating: 'PG-13',
          genres: Array.isArray(item.genres) ? item.genres.join(', ') : (item.genres || 'Action'),
          type: 'MOVIE',
          category: 'Ugandan VJ Exclusives',
          vj: item.vj || name,
          originCountry: item.origin_country || 'UG',
          region: 'east-african'
        });
      });
    }

    if (seriesRes && Array.isArray(seriesRes.data)) {
      seriesRes.data.forEach(item => {
        results.push({
          id: `rp_series_${item.id}`,
          reelplexiId: item.id,
          title: item.title,
          description: item.overview || `Voiced in Luganda by ${item.vj || name}`,
          thumbnailUrl: item.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=300&fit=crop&q=80',
          backdropUrl: item.backdrop_url || item.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=600&fit=crop&q=80',
          videoUrl: item.stream_url || 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
          duration: 'Series',
          releaseYear: item.release_date ? parseInt(item.release_date.split('-')[0], 10) : 2024,
          rating: 'PG-13',
          genres: Array.isArray(item.genres) ? item.genres.join(', ') : (item.genres || 'Drama'),
          type: 'SHOW',
          category: 'Reelplexi Series Feed',
          vj: item.vj || name,
          originCountry: item.origin_country || 'UG',
          region: 'kdrama'
        });
      });
    }

    if (results.length > 0) {
      return res.json({ data: results, total: results.length });
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
