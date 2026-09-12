import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import billingRoutes from './routes/billing.js';
import movieRoutes from './routes/movies.js';
import adminRoutes from './routes/admin.js';
import listRoutes from './routes/list.js';
import historyRoutes from './routes/history.js';
import vjRoutes from './routes/vj.js';
import regionRoutes from './routes/regions.js';
import prisma from './db.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Express parsers
app.use((req, res, next) => {
  if (req.originalUrl === '/api/billing/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mylist', listRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/vj', vjRoutes);
app.use('/api/regions', regionRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Automatic DB Seeder
async function seedDatabase() {
  try {
    // Wipe database to force category updates during hot-reload
    await prisma.movie.deleteMany();
    console.log('Database wiped for re-seeding.');

    console.log('Seeding database with Ugandan VJ movie catalog...');

    const defaultMovies = [
      {
        title: 'The Beekeeper (Luganda)',
        description: 'In The Beekeeper, one man\'s brutal campaign for vengeance takes on national stakes after he is revealed to be a former operative of a powerful clandestine organization. Voiced by VJ Junior.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=300&fit=crop&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=600&fit=crop&q=80',
        videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        tmdbId: '1011985',
        duration: '1h 45m',
        releaseYear: 2024,
        rating: 'R',
        genres: 'Action, Thriller',
        type: 'MOVIE',
        category: 'UG VJ Exclusives',
        vj: 'VJ Junior',
        originCountry: 'UG',
        region: 'east-african'
      },
      {
        title: 'Lovely Runner (Luganda)',
        description: 'Immerse yourself in this hit Korean romantic time-travel series translated with dramatic flair by VJ Emmy for Ugandan drama fans.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&h=300&fit=crop&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&h=600&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        tmdbId: '223344',
        duration: '16 Episodes',
        releaseYear: 2024,
        rating: 'TV-14',
        genres: 'Romance, Comedy, Fantasy',
        type: 'SHOW',
        category: 'K-Drama Hits',
        vj: 'VJ Emmy',
        originCountry: 'KR',
        region: 'kdrama'
      },
      {
        title: 'Extraction 2 (Luganda)',
        description: 'Tyler Rake returns for another deadly clandestine extraction mission, translated with intense action commentary by VJ Ice P.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&h=300&fit=crop&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=1200&h=600&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        tmdbId: '697843',
        duration: '2h 02m',
        releaseYear: 2023,
        rating: 'R',
        genres: 'Action, Thriller',
        type: 'MOVIE',
        category: 'Trending VJ Movies',
        vj: 'VJ Ice P',
        originCountry: 'UG',
        region: 'east-african'
      },
      {
        title: 'Anulika The Queen (Nollywood)',
        description: 'Epic Nollywood royal drama translated into vibrant local commentary by VJ Jingo.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&h=300&fit=crop&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=600&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        tmdbId: '990112',
        duration: '2h 15m',
        releaseYear: 2023,
        rating: 'PG-13',
        genres: 'Drama, African Cinema',
        type: 'MOVIE',
        category: 'UG VJ Exclusives',
        vj: 'VJ Jingo',
        originCountry: 'NG',
        region: 'nollywood'
      },
      {
        title: 'Demon Slayer: Hashira Training (Luganda)',
        description: 'Tanjiro undergoes rigorous training with the Hashira. Anime action translated with energy by VJ Mark.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&h=300&fit=crop&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&h=600&fit=crop&q=80',
        videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        tmdbId: '1219601',
        duration: '8 Episodes',
        releaseYear: 2024,
        rating: 'TV-14',
        genres: 'Animation, Action, Fantasy',
        type: 'SHOW',
        category: 'Trending VJ Movies',
        vj: 'VJ Mark',
        originCountry: 'JP',
        region: 'anime'
      },
      {
        title: 'Interstellar',
        description: 'Explorers travel through a newly discovered wormhole in space to ensure humanity\'s survival.',
        thumbnailUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/2ssWTSVklAEc98frZUQhgtGHx7s.jpg',
        videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        tmdbId: '157336',
        duration: '2h 49m',
        releaseYear: 2014,
        rating: 'PG-13',
        genres: 'Sci-Fi, Adventure, Drama',
        type: 'MOVIE',
        category: 'Action & Adventure',
        vj: 'VJ Junior',
        originCountry: 'US',
        region: 'western'
      },
      {
        title: 'Gladiator',
        description: 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.',
        thumbnailUrl: 'https://image.tmdb.org/t/p/w500/ty87IL7gRy7xs2Jv0a141l7o2qA.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/jhk6D8pim3yaByu1801kMoxXFaX.jpg',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        tmdbId: '98',
        duration: '2h 35m',
        releaseYear: 2000,
        rating: 'R',
        genres: 'Action, Drama',
        type: 'MOVIE',
        category: 'Popular on Netflix',
        vj: 'VJ Junior',
        originCountry: 'US',
        region: 'western'
      },
      {
        title: 'Jawan (Luganda)',
        description: 'Shah Rukh Khan stars in this explosive Bollywood blockbuster translated with full passion by VJ Emmy.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=300&fit=crop&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1460882010656-566798143d81?w=1200&h=600&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        tmdbId: '872906',
        duration: '2h 49m',
        releaseYear: 2023,
        rating: 'PG-13',
        genres: 'Action, Thriller',
        type: 'MOVIE',
        category: 'UG VJ Exclusives',
        vj: 'VJ Emmy',
        originCountry: 'IN',
        region: 'bollywood'
      }
    ];

    await prisma.movie.createMany({
      data: defaultMovies
    });

    console.log('Database seeded successfully with Ugandan VJ catalog!');

    // Seed default active user netflix@test.com / password123
    const defaultUserEmail = 'netflix@test.com';
    const existingUser = await prisma.user.findUnique({
      where: { email: defaultUserEmail }
    });

    if (!existingUser) {
      const passwordHash = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: defaultUserEmail,
          passwordHash,
          role: 'ADMIN',
          plan: 'PREMIUM',
          subscriptionStatus: 'ACTIVE',
          profiles: {
            create: [
              {
                name: 'VJ Fan (Alex)',
                avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80',
                maturityLimit: '18+'
              },
              {
                name: 'Luganda Cinema (Sarah)',
                avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80',
                maturityLimit: '18+'
              },
              {
                name: 'Kids',
                avatarUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&h=150&fit=crop&q=80',
                maturityLimit: '13+'
              }
            ]
          }
        }
      });
      console.log('Default premium test user account seeded successfully!');
    }
  } catch (error) {
    console.error('Seeding database failed:', error);
  }
}

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedDatabase();
});
