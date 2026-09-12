import fs from 'fs';

const vjs = ['VJ Junior', 'VJ Ice P', 'VJ Emmy', 'VJ Mark', 'VJ Jingo', 'VJ Cox', 'VJ Isma', 'VJ Sammy'];

const verifiedPosters = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&h=750&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=500&h=750&fit=crop&q=80"
];

const tmdbBackdrops = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=1200&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&h=600&fit=crop&q=80'
];

const videoUrls = [
  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
];

const movieTitles = [
  // Action
  { title: 'The Beekeeper', genres: 'Action, Thriller', type: 'MOVIE', region: 'western' },
  { title: 'Extraction 2', genres: 'Action, Thriller', type: 'MOVIE', region: 'western' },
  { title: 'John Wick: Chapter 4', genres: 'Action, Thriller, Crime', type: 'MOVIE', region: 'western' },
  { title: 'Fast X', genres: 'Action, Crime, Thriller', type: 'MOVIE', region: 'western' },
  { title: 'Top Gun: Maverick', genres: 'Action, Drama', type: 'MOVIE', region: 'western' },
  { title: 'Gladiator', genres: 'Action, Drama', type: 'MOVIE', region: 'western' },
  { title: 'Mission Impossible: Dead Reckoning', genres: 'Action, Thriller, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'Ip Man 4: The Finale', genres: 'Action, Drama, Martial Arts', type: 'MOVIE', region: 'asian' },
  { title: 'The Black Book', genres: 'Action, Thriller, Crime', type: 'MOVIE', region: 'nollywood' },
  { title: 'Jagun Jagun', genres: 'Action, Drama, History', type: 'MOVIE', region: 'nollywood' },
  { title: 'Bad Boys: Ride or Die', genres: 'Action, Comedy, Crime', type: 'MOVIE', region: 'western' },
  { title: 'Pathaan', genres: 'Action, Thriller', type: 'MOVIE', region: 'bollywood' },
  { title: 'Jawan', genres: 'Action, Thriller, Drama', type: 'MOVIE', region: 'bollywood' },
  { title: 'RRR', genres: 'Action, Drama', type: 'MOVIE', region: 'bollywood' },
  { title: 'KGF: Chapter 2', genres: 'Action, Crime, Drama', type: 'MOVIE', region: 'bollywood' },
  { title: 'The Equalizer 3', genres: 'Action, Crime, Thriller', type: 'MOVIE', region: 'western' },

  // Sci-Fi & Fantasy
  { title: 'Interstellar', genres: 'Sci-Fi, Adventure, Drama', type: 'MOVIE', region: 'western' },
  { title: 'Dune: Part Two', genres: 'Sci-Fi, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'Avatar: The Way of Water', genres: 'Sci-Fi, Action, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'Godzilla x Kong: The New Empire', genres: 'Action, Sci-Fi, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'Tenet', genres: 'Sci-Fi, Action, Thriller', type: 'MOVIE', region: 'western' },
  { title: 'Free Guy', genres: 'Action, Comedy, Sci-Fi', type: 'MOVIE', region: 'western' },

  // Superhero
  { title: 'The Dark Knight', genres: 'Action, Crime, Drama, Superhero', type: 'MOVIE', region: 'western' },
  { title: 'Deadpool & Wolverine', genres: 'Action, Comedy, Superhero', type: 'MOVIE', region: 'western' },
  { title: 'Spider-Man: Across the Spider-Verse', genres: 'Animation, Action, Superhero', type: 'MOVIE', region: 'western' },

  // Comedy
  { title: 'Rush Hour 3', genres: 'Action, Comedy, Crime', type: 'MOVIE', region: 'western' },
  { title: 'Central Intelligence', genres: 'Action, Comedy', type: 'MOVIE', region: 'western' },
  { title: 'Barbie', genres: 'Comedy, Fantasy, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'Kung Fu Panda 4', genres: 'Animation, Comedy, Action', type: 'MOVIE', region: 'western' },

  // Drama & Romance
  { title: 'Oppenheimer', genres: 'Drama, History, Thriller', type: 'MOVIE', region: 'western' },
  { title: 'Anulika The Queen', genres: 'Drama, African Cinema', type: 'MOVIE', region: 'nollywood' },

  // TV Series & Shows
  { title: 'Lovely Runner', genres: 'Romance, Comedy, Fantasy', type: 'SHOW', region: 'kdrama' },
  { title: 'Queen of Tears', genres: 'Romance, Drama, Comedy', type: 'SHOW', region: 'kdrama' },
  { title: 'Crash Landing on You', genres: 'Romance, Comedy, Drama', type: 'SHOW', region: 'kdrama' },
  { title: 'Demon Slayer: Hashira Training', genres: 'Animation, Action, Fantasy', type: 'SHOW', region: 'anime' },
  { title: 'Attack on Titan: Final Season', genres: 'Animation, Action, Fantasy', type: 'SHOW', region: 'anime' },
  { title: 'Jujutsu Kaisen: Shibuya Arc', genres: 'Animation, Action, Supernatural', type: 'SHOW', region: 'anime' },
  { title: 'Squid Game: Season 2', genres: 'Thriller, Drama, Mystery', type: 'SHOW', region: 'kdrama' },
  { title: 'Money Heist: Korea', genres: 'Action, Crime, Thriller', type: 'SHOW', region: 'kdrama' }
];

const catalog = [];
let idCount = 1000;

vjs.forEach((vj, vjIndex) => {
  movieTitles.forEach((m, mIndex) => {
    if ((vjIndex + mIndex) % 2 === 0 || (vjIndex + mIndex) % 3 === 0) {
      idCount++;
      const poster = verifiedPosters[(idCount) % verifiedPosters.length];
      const backdrop = tmdbBackdrops[(idCount) % tmdbBackdrops.length];
      const video = videoUrls[(idCount) % videoUrls.length];
      const year = 2020 + (idCount % 5);

      catalog.push({
        title: `${m.title} (Luganda)`,
        description: `Experience ${m.title} translated into clear Luganda commentary by ${vj}. Full HD release with epic Ugandan studio voiceover.`,
        thumbnailUrl: poster,
        backdropUrl: backdrop,
        videoUrl: video,
        tmdbId: String(idCount),
        duration: m.type === 'SHOW' ? `${10 + (idCount % 10)} Episodes` : `${1 + (idCount % 2)}h ${20 + (idCount % 35)}m`,
        releaseYear: year,
        rating: idCount % 2 === 0 ? 'PG-13' : 'R',
        genres: m.genres,
        type: m.type,
        category: m.type === 'SHOW' ? 'TV Series & Shows' : (idCount % 3 === 0 ? 'Trending VJ Movies' : 'UG VJ Exclusives'),
        vj: vj,
        originCountry: m.region === 'kdrama' ? 'KR' : (m.region === 'anime' ? 'JP' : (m.region === 'nollywood' ? 'NG' : (m.region === 'bollywood' ? 'IN' : 'US'))),
        region: m.region
      });
    }
  });
});

console.log('Total generated catalog count:', catalog.length);
const fileContent = `export const catalogMovies = ${JSON.stringify(catalog, null, 2)};\n`;
fs.writeFileSync('server/seedCatalog.js', fileContent);
console.log('Successfully saved server/seedCatalog.js with clean posters!');
