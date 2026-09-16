import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getAccountStats, getAccountUsage, getTopAnalytics, getAccountActivity, getApiKey, reelplexiFetch } from '../services/reelplexi.js';

const router = express.Router();

// Apply Admin gate to all endpoints here
router.use(authenticateToken);
router.use(requireAdmin);

// ==========================================
// 1. User Signups & Accounts Management
// ==========================================
router.get('/users', async (req, res) => {
  try {
    const rawUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionEnd: true,
        createdAt: true,
        profiles: {
          select: { id: true, name: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const users = rawUsers.map(u => ({
      ...u,
      name: (u.profiles && u.profiles.length > 0 && u.profiles[0].name) ? u.profiles[0].name : u.email.split('@')[0]
    }));

    res.json(users);
  } catch (error) {
    console.error('Error fetching user signups list:', error);
    res.status(500).json({ error: 'Server error fetching user signups' });
  }
});

// Assign / upgrade / remove package for a user
router.put('/users/:id/subscription', async (req, res) => {
  const { id } = req.params;
  const { packageId, action } = req.body; // action: 'assign' | 'remove'

  try {
    if (action === 'remove') {
      const updated = await prisma.user.update({
        where: { id },
        data: { plan: 'NONE', subscriptionStatus: 'INACTIVE', subscriptionEnd: null }
      });
      return res.json({ success: true, user: updated });
    }

    if (!packageId) return res.status(400).json({ error: 'packageId is required' });

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    // Calculate expiry using same logic as billing
    const now = new Date();
    const expiration = new Date(now);
    const str = String(pkg.interval).toUpperCase().trim();
    const match = str.match(/^(\d+)[_\s:]*([A-Z]+)$/);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2];
      if (val === 0) expiration.setFullYear(expiration.getFullYear() + 100);
      else if (unit.startsWith('MIN')) expiration.setMinutes(expiration.getMinutes() + val);
      else if (unit.startsWith('HOUR')) expiration.setHours(expiration.getHours() + val);
      else if (unit.startsWith('DAY')) expiration.setDate(expiration.getDate() + val);
      else if (unit.startsWith('WEEK')) expiration.setDate(expiration.getDate() + val * 7);
      else if (unit.startsWith('MONTH')) expiration.setMonth(expiration.getMonth() + val);
      else if (unit.startsWith('YEAR')) expiration.setFullYear(expiration.getFullYear() + val);
    } else {
      expiration.setMonth(expiration.getMonth() + 1);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { plan: pkg.name, subscriptionStatus: 'ACTIVE', subscriptionEnd: expiration }
    });

    res.json({ success: true, user: updated, package: pkg, subscriptionEnd: expiration });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription: ' + error.message });
  }
});

// Delete user account
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }
    if (user.role === 'ADMIN' && (await prisma.user.count({ where: { role: 'ADMIN' } })) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only Admin account' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

// ==========================================
// 2. System Settings & Manual API Key Setup
// ==========================================
router.get('/settings', async (req, res) => {
  try {
    const apiKey = await getApiKey();
    const allSettings = await prisma.systemSetting.findMany();
    const settingsObj = {};
    allSettings.forEach(s => { settingsObj[s.key] = s.value; });

    res.json({
      REELPLEXI_API_KEY: apiKey,
      settings: settingsObj
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.post('/settings', async (req, res) => {
  const { key, value, settings } = req.body;

  try {
    if (settings && typeof settings === 'object') {
      const results = [];
      for (const [k, v] of Object.entries(settings)) {
        const updated = await prisma.systemSetting.upsert({
          where: { key: k },
          update: { value: String(v || '') },
          create: { key: k, value: String(v || '') }
        });
        results.push(updated);
      }
      return res.json({ success: true, settings: results });
    }

    if (!key) {
      return res.status(400).json({ error: 'Setting key is required' });
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: value !== undefined ? String(value) : '' },
      create: { key, value: value !== undefined ? String(value) : '' }
    });

    res.json({ success: true, setting: updated });
  } catch (error) {
    console.error('Error updating system setting:', error);
    res.status(500).json({ error: 'Failed to save system setting' });
  }
});

// LivePay Diagnostic & Balance Test Endpoint
router.get('/livepay/test-balance', async (req, res) => {
  try {
    const keySetting = await prisma.systemSetting.findUnique({ where: { key: 'LIVEPAY_API_KEY' } });
    const accSetting = await prisma.systemSetting.findUnique({ where: { key: 'LIVEPAY_ACCOUNT_NUMBER' } });

    const apiKey = keySetting?.value?.trim();
    const accountNumber = accSetting?.value?.trim();

    if (!apiKey) {
      return res.status(400).json({ error: 'LivePay API Key is not set in settings' });
    }

    const lpRes = await fetch('https://livepay.me/api/check-balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const lpData = await lpRes.json();

    if (!lpRes.ok || lpData.success === false) {
      const msg = lpData.message || lpData.error || `LivePay error (${lpRes.status})`;
      return res.status(lpRes.status || 400).json({ error: msg, details: lpData });
    }

    res.json({
      success: true,
      message: 'LivePay API Key verified successfully!',
      accountNumber: accountNumber || 'Not specified',
      balanceData: lpData
    });
  } catch (error) {
    console.error('Error testing LivePay balance:', error);
    res.status(500).json({ error: 'Failed to connect to LivePay server: ' + error.message });
  }
});

// Reelplexi API Live Stats & Analytics for Admin
router.get('/reelplexi/stats', async (req, res) => {
  try {
    const stats = await getAccountStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Reelplexi stats' });
  }
});

router.get('/reelplexi/usage', async (req, res) => {
  try {
    const usage = await getAccountUsage(req.query.range || '30d');
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Reelplexi usage' });
  }
});

router.get('/reelplexi/activity', async (req, res) => {
  try {
    const activity = await getAccountActivity(req.query.limit || 10);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Reelplexi activity' });
  }
});

router.get('/reelplexi/top-movies', async (req, res) => {
  try {
    const top = await getTopAnalytics('movies', 10);
    res.json(top);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Reelplexi top movies' });
  }
});

// ==========================================
// 3. Media Ingestion & Catalog Management
// ==========================================
router.get('/movies', async (req, res) => {
  try {
    const dbMovies = await prisma.movie.findMany({
      orderBy: { title: 'asc' }
    });

    // Fetch Reelplexi live stats & multi-page catalog in parallel
    const [moviesPage1, seriesPage1] = await Promise.all([
      reelplexiFetch('/movies', { per_page: 100, page: 1 }).catch(() => null),
      reelplexiFetch('/series', { per_page: 100, page: 1 }).catch(() => null)
    ]);

    const reelplexiMoviesTotal = moviesPage1?.meta?.total || 4541;
    const reelplexiSeriesTotal = seriesPage1?.meta?.total || 1185;
    const reelplexiTotalContent = reelplexiMoviesTotal + reelplexiSeriesTotal;

    // Fetch multi-page catalog to display in admin catalog manager
    const moviePromises = Array.from({ length: 8 }, (_, i) => reelplexiFetch('/movies', { per_page: 100, page: i + 1 }).catch(() => null));
    const seriesPromises = Array.from({ length: 4 }, (_, i) => reelplexiFetch('/series', { per_page: 100, page: i + 1 }).catch(() => null));

    const results = await Promise.all([...moviePromises, ...seriesPromises]);
    const liveItems = [];

    results.forEach(res => {
      if (res && Array.isArray(res.data)) {
        res.data.forEach(item => {
          const isShow = item.type === 'series' || item.type === 'SHOW';
          let rawPoster = item.poster_url || item.poster_path || item.poster || item.thumbnailUrl;
          if (rawPoster && typeof rawPoster === 'string') {
            if (rawPoster.startsWith('/storage/') || rawPoster.startsWith('/uploads/')) {
              rawPoster = `https://app.reelplexi.com${rawPoster}`;
            } else if (rawPoster.startsWith('/')) {
              rawPoster = `https://image.tmdb.org/t/p/w500${rawPoster}`;
            } else if (!rawPoster.startsWith('http://') && !rawPoster.startsWith('https://')) {
              rawPoster = `https://app.reelplexi.com/${rawPoster}`;
            }
          }
          liveItems.push({
            id: `rp_${item.id}`,
            reelplexiId: item.id,
            title: item.title,
            thumbnailUrl: rawPoster || 'https://image.tmdb.org/t/p/w500/1pdfLPoLkh9DjhYStB2ERmLFwhC.jpg',
            vj: item.vj || 'VJ Junior',
            region: item.origin_country || 'UG',
            category: item.category || (isShow ? 'TV Series & Shows' : 'Ugandan VJ Exclusives'),
            rating: item.rating || 'PG-13',
            type: isShow ? 'SHOW' : 'MOVIE',
            source: 'Reelplexi API'
          });
        });
      }
    });

    const mappedDbMovies = dbMovies.map(m => ({
      ...m,
      source: 'Custom DB Override'
    }));

    // Deduplicate catalog items
    const seen = new Set();
    const allCatalog = [];
    [...mappedDbMovies, ...liveItems].forEach(m => {
      const key = m.reelplexiId || m.id || m.title;
      if (!seen.has(key)) {
        seen.add(key);
        allCatalog.push(m);
      }
    });

    res.json({
      movies: allCatalog,
      stats: {
        reelplexiMoviesTotal,
        reelplexiSeriesTotal,
        reelplexiTotalContent,
        loadedCatalogCount: allCatalog.length,
        dbMoviesCount: dbMovies.length
      }
    });
  } catch (error) {
    console.error('Error fetching admin movie list:', error);
    res.status(500).json({ error: 'Server error listing movies' });
  }
});

// Add new movie (with VJ & Region support)
router.post('/movies', async (req, res) => {
  const {
    title,
    description,
    thumbnailUrl,
    backdropUrl,
    videoUrl,
    tmdbId,
    duration,
    releaseYear,
    rating,
    genres,
    type,
    category,
    vj,
    originCountry,
    region
  } = req.body;

  if (!title || !description || !thumbnailUrl || !backdropUrl || !videoUrl || !releaseYear || !rating || !genres || !type || !category) {
    return res.status(400).json({ error: 'All primary fields are required to ingest content' });
  }

  try {
    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        thumbnailUrl,
        backdropUrl,
        videoUrl,
        tmdbId: tmdbId || null,
        duration: duration || '2h',
        releaseYear: parseInt(releaseYear, 10),
        rating,
        genres,
        type,
        category,
        vj: vj || 'VJ Junior',
        originCountry: originCountry || 'UG',
        region: region || 'east-african'
      }
    });

    res.status(201).json(movie);
  } catch (error) {
    console.error('Error ingesting movie:', error);
    res.status(500).json({ error: 'Server error adding movie' });
  }
});

// Edit existing movie
router.put('/movies/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    thumbnailUrl,
    backdropUrl,
    videoUrl,
    tmdbId,
    duration,
    releaseYear,
    rating,
    genres,
    type,
    category,
    vj,
    originCountry,
    region
  } = req.body;

  try {
    const movie = await prisma.movie.findUnique({
      where: { id }
    });

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const updatedMovie = await prisma.movie.update({
      where: { id },
      data: {
        title: title !== undefined ? title : movie.title,
        description: description !== undefined ? description : movie.description,
        thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : movie.thumbnailUrl,
        backdropUrl: backdropUrl !== undefined ? backdropUrl : movie.backdropUrl,
        videoUrl: videoUrl !== undefined ? videoUrl : movie.videoUrl,
        tmdbId: tmdbId !== undefined ? (tmdbId || null) : movie.tmdbId,
        duration: duration !== undefined ? duration : movie.duration,
        releaseYear: releaseYear !== undefined ? parseInt(releaseYear, 10) : movie.releaseYear,
        rating: rating !== undefined ? rating : movie.rating,
        genres: genres !== undefined ? genres : movie.genres,
        type: type !== undefined ? type : movie.type,
        category: category !== undefined ? category : movie.category,
        vj: vj !== undefined ? vj : movie.vj,
        originCountry: originCountry !== undefined ? originCountry : movie.originCountry,
        region: region !== undefined ? region : movie.region
      }
    });

    res.json(updatedMovie);
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({ error: 'Server error updating movie' });
  }
});

// Delete movie
router.delete('/movies/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const movie = await prisma.movie.findUnique({
      where: { id }
    });

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    await prisma.movie.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Movie deleted successfully from catalog' });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ error: 'Server error deleting movie' });
  }
});

// ==========================================
// 6. Subscription Package Management
// ==========================================
async function fetchAdminPackages() {
  if (prisma.package) {
    return prisma.package.findMany({ orderBy: { createdAt: 'desc' } });
  }
  try {
    return await prisma.$queryRawUnsafe(`SELECT * FROM "Package" ORDER BY "createdAt" DESC`);
  } catch (err) {
    return [];
  }
}

router.get('/packages', async (req, res) => {
  try {
    const packages = await fetchAdminPackages();
    res.json(packages);
  } catch (error) {
    console.error('Error fetching admin packages:', error);
    res.status(500).json({ error: 'Server error fetching packages: ' + error.message });
  }
});

router.post('/packages', async (req, res) => {
  const { name, price, currency, interval, description, features, resolution, screens, isActive } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Package name and price are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();
  const pkgPrice = parseFloat(price);
  const pkgCurrency = currency || 'UGX';
  const pkgInterval = interval || 'MONTHLY';
  const pkgDesc = description || '';
  const pkgFeat = features || '';
  const pkgRes = resolution || '1080p Full HD';
  const pkgScr = screens ? parseInt(screens, 10) : 2;
  const pkgActive = isActive !== undefined ? Boolean(isActive) : true;
  const pkgId = 'pkg_' + Date.now() + '_' + Math.random().toString(36).substring(7);

  try {
    if (prisma.package) {
      const pkg = await prisma.package.create({
        data: {
          name,
          slug,
          price: pkgPrice,
          currency: pkgCurrency,
          interval: pkgInterval,
          description: pkgDesc,
          features: pkgFeat,
          resolution: pkgRes,
          screens: pkgScr,
          isActive: pkgActive
        }
      });
      return res.status(201).json(pkg);
    }
  } catch (err) {
    console.warn('Prisma package create failed, attempting raw SQL:', err.message);
  }

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Package" ("id", "name", "slug", "price", "currency", "interval", "description", "features", "resolution", "screens", "isActive", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      pkgId, name, slug, pkgPrice, pkgCurrency, pkgInterval, pkgDesc, pkgFeat, pkgRes, pkgScr, pkgActive ? 1 : 0
    );

    res.status(201).json({
      id: pkgId,
      name,
      slug,
      price: pkgPrice,
      currency: pkgCurrency,
      interval: pkgInterval,
      description: pkgDesc,
      features: pkgFeat,
      resolution: pkgRes,
      screens: pkgScr,
      isActive: pkgActive
    });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Failed to create subscription package: ' + error.message });
  }
});

router.put('/packages/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, currency, interval, description, features, resolution, screens, isActive } = req.body;

  try {
    if (prisma.package) {
      const updated = await prisma.package.update({
        where: { id },
        data: {
          name,
          price: price !== undefined ? parseFloat(price) : undefined,
          currency,
          interval,
          description,
          features,
          resolution,
          screens: screens !== undefined ? parseInt(screens, 10) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined
        }
      });
      return res.json(updated);
    }
  } catch (err) {
    console.warn('Prisma package update failed, trying raw SQL:', err.message);
  }

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Package" SET 
        "name" = COALESCE(?, "name"),
        "price" = COALESCE(?, "price"),
        "currency" = COALESCE(?, "currency"),
        "interval" = COALESCE(?, "interval"),
        "description" = COALESCE(?, "description"),
        "features" = COALESCE(?, "features"),
        "resolution" = COALESCE(?, "resolution"),
        "screens" = COALESCE(?, "screens"),
        "isActive" = COALESCE(?, "isActive"),
        "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ?`,
      name || null, price !== undefined ? parseFloat(price) : null, currency || null, interval || null,
      description || null, features || null, resolution || null, screens !== undefined ? parseInt(screens, 10) : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null, id
    );

    res.json({ success: true, message: 'Package updated successfully' });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Failed to update package: ' + error.message });
  }
});

router.delete('/packages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (prisma.package) {
      await prisma.package.delete({ where: { id } });
      return res.json({ success: true, message: 'Package deleted successfully' });
    }
  } catch (err) {
    console.warn('Prisma package delete failed, trying raw SQL:', err.message);
  }

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Package" WHERE "id" = ?`, id);
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Failed to delete package: ' + error.message });
  }
});

export default router;
