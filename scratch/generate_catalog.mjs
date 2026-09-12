import fs from 'fs';

const vjs = ['VJ Junior', 'VJ Ice P', 'VJ Emmy', 'VJ Mark', 'VJ Jingo', 'VJ Cox', 'VJ Isma', 'VJ Sammy'];

const tmdbPosters = [
  'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  'https://image.tmdb.org/t/p/w500/ty87IL7gRy7xs2Jv0a141l7o2qA.jpg',
  'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGvC271ugXn.jpg',
  'https://image.tmdb.org/t/p/w500/1pdfLPoVxWGlGivJR2pOFGDwqOt.jpg',
  'https://image.tmdb.org/t/p/w500/vZloFAK7NHYSTW35Mv3zFiVJviD.jpg',
  'https://image.tmdb.org/t/p/w500/62HCfaYToLhczccLhGfvz2zP9m0.jpg',
  'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'https://image.tmdb.org/t/p/w500/fiVW06LEDB9zFivmOLiHrzKVzG.jpg',
  'https://image.tmdb.org/t/p/w500/cvsXj3G9YmYiBvvy3uP1yC8F8t.jpg',
  'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
  'https://image.tmdb.org/t/p/w500/m11gVOF8qL46gPyRkyvuv2mHQkF.jpg',
  'https://image.tmdb.org/t/p/w500/b0PlSFdDwbyK0cf5RxwDpaOJmTe.jpg',
  'https://image.tmdb.org/t/p/w500/t68W885FiHYb2yWfLz3Zqj2dEFo.jpg',
  'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
  'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8g4Djt4rDq9FqV2L.jpg',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&h=300&fit=crop&q=80'
];

const tmdbBackdrops = [
  'https://image.tmdb.org/t/p/original/2ssWTSVklAEc98frZUQhgtGHx7s.jpg',
  'https://image.tmdb.org/t/p/original/jhk6D8pim3yaByu1801kMoxXFaX.jpg',
  'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
  'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s52SuY.jpg',
  'https://image.tmdb.org/t/p/original/h8gWv0zCefvknEJhGUtj19RZmo4.jpg',
  'https://image.tmdb.org/t/p/original/AaV1YIdWKnjAivAX55mlTUtqE2.jpg',
  'https://image.tmdb.org/t/p/original/nMKmy8FiJRiHKBDStwhRMNyw5st.jpg',
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
  { title: 'Wrath of Man', genres: 'Action, Crime, Thriller', type: 'MOVIE', region: 'western' },
  { title: 'Mad Max: Fury Road', genres: 'Action, Sci-Fi', type: 'MOVIE', region: 'western' },
  { title: 'Furiosa: A Mad Max Saga', genres: 'Action, Sci-Fi', type: 'MOVIE', region: 'western' },
  { title: 'Civil War', genres: 'Action, Thriller, Drama', type: 'MOVIE', region: 'western' },
  { title: 'Monkey Man', genres: 'Action, Thriller', type: 'MOVIE', region: 'western' },
  { title: 'The Raid 2', genres: 'Action, Crime, Martial Arts', type: 'MOVIE', region: 'asian' },
  { title: 'Hero (Jet Li)', genres: 'Action, Drama, Martial Arts', type: 'MOVIE', region: 'asian' },
  { title: 'Crouching Tiger Hidden Dragon', genres: 'Action, Romance, Martial Arts', type: 'MOVIE', region: 'asian' },

  // Sci-Fi & Fantasy
  { title: 'Interstellar', genres: 'Sci-Fi, Adventure, Drama', type: 'MOVIE', region: 'western' },
  { title: 'Dune: Part Two', genres: 'Sci-Fi, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'Dune: Part One', genres: 'Sci-Fi, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'Avatar: The Way of Water', genres: 'Sci-Fi, Action, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'Godzilla x Kong: The New Empire', genres: 'Action, Sci-Fi, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'Kingdom of the Planet of the Apes', genres: 'Sci-Fi, Action, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'The Matrix Resurrections', genres: 'Sci-Fi, Action', type: 'MOVIE', region: 'western' },
  { title: 'Tenet', genres: 'Sci-Fi, Action, Thriller', type: 'MOVIE', region: 'western' },
  { title: 'Inception', genres: 'Sci-Fi, Action, Thriller', type: 'MOVIE', region: 'western' },
  { title: 'Transformers: Rise of the Beasts', genres: 'Action, Sci-Fi, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'Free Guy', genres: 'Action, Comedy, Sci-Fi', type: 'MOVIE', region: 'western' },

  // Superhero
  { title: 'The Dark Knight', genres: 'Action, Crime, Drama, Superhero', type: 'MOVIE', region: 'western' },
  { title: 'Deadpool & Wolverine', genres: 'Action, Comedy, Superhero', type: 'MOVIE', region: 'western' },
  { title: 'Spider-Man: Across the Spider-Verse', genres: 'Animation, Action, Superhero', type: 'MOVIE', region: 'western' },
  { title: 'The Batman', genres: 'Action, Crime, Drama, Thriller', type: 'MOVIE', region: 'western' },
  { title: 'Guardians of the Galaxy Vol 3', genres: 'Action, Sci-Fi, Comedy', type: 'MOVIE', region: 'western' },
  { title: 'Avengers: Endgame', genres: 'Action, Sci-Fi, Superhero', type: 'MOVIE', region: 'western' },
  { title: 'Black Panther: Wakanda Forever', genres: 'Action, Sci-Fi, Drama', type: 'MOVIE', region: 'western' },

  // Comedy
  { title: 'Rush Hour 3', genres: 'Action, Comedy, Crime', type: 'MOVIE', region: 'western' },
  { title: 'Central Intelligence', genres: 'Action, Comedy', type: 'MOVIE', region: 'western' },
  { title: 'Barbie', genres: 'Comedy, Fantasy, Adventure', type: 'MOVIE', region: 'western' },
  { title: 'Kung Fu Panda 4', genres: 'Animation, Comedy, Action', type: 'MOVIE', region: 'western' },
  { title: 'The Dictator', genres: 'Comedy', type: 'MOVIE', region: 'western' },
  { title: 'Ride Along 2', genres: 'Action, Comedy', type: 'MOVIE', region: 'western' },
  { title: 'Johnny English Strikes Again', genres: 'Action, Comedy', type: 'MOVIE', region: 'western' },
  { title: 'White Chicks', genres: 'Comedy, Crime', type: 'MOVIE', region: 'western' },
  { title: 'Jump Street 22', genres: 'Action, Comedy', type: 'MOVIE', region: 'western' },

  // Drama & Romance
  { title: 'Oppenheimer', genres: 'Drama, History, Thriller', type: 'MOVIE', region: 'western' },
  { title: 'Anulika The Queen', genres: 'Drama, African Cinema', type: 'MOVIE', region: 'nollywood' },
  { title: 'Titanic', genres: 'Romance, Drama', type: 'MOVIE', region: 'western' },
  { title: 'The Notebook', genres: 'Romance, Drama', type: 'MOVIE', region: 'western' },
  { title: 'A Star is Born', genres: 'Drama, Romance, Music', type: 'MOVIE', region: 'western' },
  { title: 'Me Before You', genres: 'Romance, Drama', type: 'MOVIE', region: 'western' },
  { title: 'Fifty Shades of Grey', genres: 'Romance, Drama', type: 'MOVIE', region: 'western' },
  { title: 'Past Lives', genres: 'Romance, Drama', type: 'MOVIE', region: 'western' },

  // TV Series & Shows
  { title: 'Lovely Runner', genres: 'Romance, Comedy, Fantasy', type: 'SHOW', region: 'kdrama' },
  { title: 'Queen of Tears', genres: 'Romance, Drama, Comedy', type: 'SHOW', region: 'kdrama' },
  { title: 'Crash Landing on You', genres: 'Romance, Comedy, Drama', type: 'SHOW', region: 'kdrama' },
  { title: 'Demon Slayer: Hashira Training', genres: 'Animation, Action, Fantasy', type: 'SHOW', region: 'anime' },
  { title: 'Attack on Titan: Final Season', genres: 'Animation, Action, Fantasy', type: 'SHOW', region: 'anime' },
  { title: 'Jujutsu Kaisen: Shibuya Arc', genres: 'Animation, Action, Supernatural', type: 'SHOW', region: 'anime' },
  { title: 'Squid Game: Season 2', genres: 'Thriller, Drama, Mystery', type: 'SHOW', region: 'kdrama' },
  { title: 'Money Heist: Korea', genres: 'Action, Crime, Thriller', type: 'SHOW', region: 'kdrama' },
  { title: 'Vincenzo', genres: 'Action, Comedy, Crime', type: 'SHOW', region: 'kdrama' },
  { title: 'All of Us Are Dead', genres: 'Horror, Action, Drama', type: 'SHOW', region: 'kdrama' },
  { title: 'Solo Leveling', genres: 'Animation, Action, Fantasy', type: 'SHOW', region: 'anime' },
  { title: 'One Piece (Live Action)', genres: 'Action, Adventure, Fantasy', type: 'SHOW', region: 'western' },
  { title: 'Shogun', genres: 'Drama, History, Action', type: 'SHOW', region: 'western' },
  { title: 'House of the Dragon Season 2', genres: 'Action, Drama, Fantasy', type: 'SHOW', region: 'western' },
  { title: 'The Boys Season 4', genres: 'Action, Sci-Fi, Comedy', type: 'SHOW', region: 'western' },
  { title: 'Stranger Things Season 4', genres: 'Sci-Fi, Horror, Drama', type: 'SHOW', region: 'western' },
  { title: 'Reacher Season 2', genres: 'Action, Crime, Thriller', type: 'SHOW', region: 'western' },
  { title: 'Peaky Blinders', genres: 'Crime, Drama', type: 'SHOW', region: 'western' },
  { title: 'Breaking Bad', genres: 'Crime, Drama, Thriller', type: 'SHOW', region: 'western' },
  { title: 'Game of Thrones', genres: 'Action, Drama, Fantasy', type: 'SHOW', region: 'western' },
  { title: 'Lupin', genres: 'Crime, Drama, Mystery', type: 'SHOW', region: 'western' }
];

const catalog = [];
let idCount = 1000;

// Create multiple VJ voiceover variants so every VJ has 20-30 titles!
vjs.forEach((vj, vjIndex) => {
  movieTitles.forEach((m, mIndex) => {
    // Select subset for each VJ to vary catalog
    if ((vjIndex + mIndex) % 2 === 0 || (vjIndex + mIndex) % 3 === 0) {
      idCount++;
      const poster = tmdbPosters[(idCount) % tmdbPosters.length];
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
console.log('Successfully saved server/seedCatalog.js with', catalog.length, 'movies & series!');
