import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import CategoryDiscovery from '../components/CategoryDiscovery';
import MovieRow from '../components/MovieRow';
import DetailModal from '../components/DetailModal';
import VideoPlayer from '../components/VideoPlayer';
import MovieCard from '../components/MovieCard';
import UpgradeModal from '../components/UpgradeModal';
import SignupModal from '../components/SignupModal';
import { api } from '../utils/api';
import { SkeletonHero, SkeletonRow } from '../components/SkeletonRow';

export default function Browse() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('home');
  const [activeVJ, setActiveVJ] = useState('');
  const [activeRegion, setActiveRegion] = useState('');
  const [activeGenre, setActiveGenre] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [user, setUser] = useState(() => {
    const str = localStorage.getItem('netflix_user');
    return str ? JSON.parse(str) : null;
  });
  const isSubscribed = user?.subscriptionStatus === 'ACTIVE' && (
    user?.role === 'ADMIN' || !user?.subscriptionEnd || new Date(user.subscriptionEnd) > new Date()
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMovieTarget, setUpgradeMovieTarget] = useState(null);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activePlayMovie, setActivePlayMovie] = useState(null);

  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('netflix_token');
  const currentProfile = isLoggedIn ? JSON.parse(localStorage.getItem('netflix_profile') || 'null') : null;

  const handlePlay = (movie) => {
    if (!isLoggedIn) { setShowSignupModal(true); return; }
    if (!isSubscribed) { setUpgradeMovieTarget(movie); setShowUpgradeModal(true); }
    else setActivePlayMovie(movie);
  };

  useEffect(() => {
    if (isLoggedIn) {
      api.get('/auth/me')
        .then(res => {
          if (res && res.user) {
            setUser(res.user);
            localStorage.setItem('netflix_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetchBrowseData();
  }, [activeTab, activeVJ, activeRegion, activeGenre]);

  const fetchBrowseData = async () => {
    try {
      let queryParams = [];
      if (activeVJ) queryParams.push(`vj=${encodeURIComponent(activeVJ)}`);
      if (activeRegion) queryParams.push(`region=${encodeURIComponent(activeRegion)}`);
      if (activeTab === 'series') queryParams.push('type=SHOW');
      if (activeTab === 'movies') queryParams.push('type=MOVIE');
      if (activeTab === 'latest') queryParams.push('latest=true');
      if (activeTab === 'trending') queryParams.push('trending=true');
      if (activeGenre) queryParams.push(`genre=${encodeURIComponent(activeGenre)}`);
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

      const reqs = [api.get(`/movies${queryString}`)];
      if (isLoggedIn && currentProfile) {
        reqs.push(api.get(`/mylist/${currentProfile.id}`));
        reqs.push(api.get(`/history/${currentProfile.id}`));
      }
      const [catalog, list, history] = await Promise.all(reqs);

      // Shuffle each category's movies so order is different every visit
      const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
      const shuffledCategories = (catalog.categories || []).map(cat => ({
        ...cat,
        movies: shuffle(cat.movies || cat.items || []),
        items: shuffle(cat.items || cat.movies || [])
      }));
      setCategories(shuffledCategories);

      // Pick a random featured movie from all available movies each session
      const allMovies = shuffledCategories.flatMap(c => c.movies).filter(Boolean);
      const sessionKey = 'mz_featured_' + activeTab + activeVJ + activeRegion + activeGenre;
      let featuredMovie = catalog.featured;
      if (allMovies.length > 0) {
        const stored = sessionStorage.getItem(sessionKey);
        const storedMovie = stored ? allMovies.find(m => m.id === stored) : null;
        if (storedMovie) {
          featuredMovie = storedMovie;
        } else {
          const pick = allMovies[Math.floor(Math.random() * allMovies.length)];
          sessionStorage.setItem(sessionKey, pick.id);
          featuredMovie = pick;
        }
      }
      setFeatured(featuredMovie);
      if (list) setWatchlist(list);
      if (history) setContinueWatching(history);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await api.get(`/movies/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(results);
      } catch {}
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleToggleWatchlist = async (movie) => {
    if (!isLoggedIn) { setShowSignupModal(true); return; }
    if (!currentProfile) return;
    const isInList = watchlist.some(m => m.id === movie.id);
    try {
      if (isInList) {
        await api.delete('/mylist', { profileId: currentProfile.id, movieId: movie.id });
        setWatchlist(prev => prev.filter(m => m.id !== movie.id));
      } else {
        const added = await api.post('/mylist', { profileId: currentProfile.id, movieId: movie.id });
        setWatchlist(prev => [added, ...prev]);
      }
    } catch (err) { console.error('Error toggling watchlist:', err); }
  };

  const isMovieInWatchlist = (movieId) => watchlist.some(m => m.id === movieId);

  const scrollToRow = (nameFragment) => {
    setTimeout(() => {
      const rows = document.querySelectorAll('[id^="row-"]');
      const fragment = nameFragment.toLowerCase();
      for (const row of rows) {
        if (row.id.includes(fragment)) { row.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      }
      document.querySelector('.movie-row-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const getFilterHeader = () => {
    if (activeVJ) return `Showing titles translated by ${activeVJ}`;
    if (activeRegion) return `Showing ${activeRegion.toUpperCase()} titles`;
    if (activeGenre) return `${activeGenre} Movies & Shows`;
    if (activeTab === 'series') return `TV Series & Shows Catalog`;
    if (activeTab === 'movies') return `Feature Movies Catalog`;
    if (activeTab === 'latest') return `Latest Additions & Releases`;
    if (activeTab === 'trending') return `Trending Movies & Series Now`;
    return null;
  };

  return (
    <div className="browse-container">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeVJ={activeVJ}
        setActiveVJ={setActiveVJ}
        activeRegion={activeRegion}
        setActiveRegion={setActiveRegion}
      />

      {loading && !searchQuery && (
        <div className="browse-skeleton">
          <SkeletonHero />
          <SkeletonRow count={6} />
          <SkeletonRow count={6} />
          <SkeletonRow count={6} />
        </div>
      )}

      {!loading && searchQuery ? (
        <div style={{ padding: 'clamp(80px, 15vw, 120px) 4% 60px 4%' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '24px' }}>
            Search Results for "{searchQuery}"
          </h2>
          {searchLoading ? (
            <div style={{ color: '#aaa' }}>Searching database...</div>
          ) : searchResults.length > 0 ? (
            <div className="movie-grid-container">
              {searchResults.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onPlay={handlePlay}
                  onOpenModal={setSelectedMovie}
                  isInWatchlist={isMovieInWatchlist(movie.id)}
                  onToggleWatchlist={handleToggleWatchlist}
                  isSubscribed={isSubscribed}
                />
              ))}
            </div>
          ) : (
            <div style={{ color: '#aaa', padding: '40px 0' }}>No matching movies or shows found.</div>
          )}
        </div>
      ) : (
        !loading && (
          <>
            {featured && (
              <HeroBanner
                movie={featured}
                onPlay={handlePlay}
                onOpenModal={setSelectedMovie}
                isSubscribed={isSubscribed}
              />
            )}

            <CategoryDiscovery
              onSelectPill={(genre) => {
                if (genre === 'All') {
                  setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); setActiveGenre('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (genre === 'K-Drama') { scrollToRow('kdrama') || scrollToRow('romance'); }
                else if (genre === 'Anime') { scrollToRow('anime') || scrollToRow('sci-fi'); }
                else { scrollToRow(genre.toLowerCase()); }
              }}
              onSelectTopic={(card) => {
                if (card.regionKey === 'kdrama') scrollToRow('romance');
                else if (card.regionKey) scrollToRow(card.regionKey);
                else if (card.vjKey) scrollToRow('vj');
                else if (card.genreKey) scrollToRow(card.genreKey.toLowerCase());
              }}
              activeGenre={activeGenre}
            />

            <div style={{ paddingBottom: '60px', position: 'relative', zIndex: '5', background: '#141414' }}>
              {getFilterHeader() && (
                <div style={{ padding: '20px 4% 0 4%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', borderLeft: '4px solid #e50914', paddingLeft: '12px' }}>
                    {getFilterHeader()}
                  </h2>
                  <button
                    style={{ background: '#333', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                    onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); setActiveGenre(''); }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}

              {continueWatching.length > 0 && !activeVJ && !activeRegion && (
                <MovieRow title="Continue Watching" movies={continueWatching.map(item => item.movie)}
                  onPlay={handlePlay} onOpenModal={setSelectedMovie} watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist} isSubscribed={isSubscribed} />
              )}

              {watchlist.length > 0 && !activeVJ && !activeRegion && (
                <MovieRow title="My List" movies={watchlist}
                  onPlay={handlePlay} onOpenModal={setSelectedMovie} watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist} isSubscribed={isSubscribed} />
              )}

              {categories.map((cat, idx) => (
                <MovieRow key={idx} title={cat.name} movies={cat.movies || cat.items}
                  onPlay={handlePlay} onOpenModal={setSelectedMovie} watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist} isSubscribed={isSubscribed} />
              ))}
            </div>
          </>
        )
      )}

      <SignupModal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} />

      {selectedMovie && (
        <DetailModal movie={selectedMovie} onClose={() => setSelectedMovie(null)}
          onPlay={handlePlay} watchlist={watchlist} onToggleWatchlist={handleToggleWatchlist}
          isSubscribed={isSubscribed} />
      )}

      {activePlayMovie && (
        <VideoPlayer movie={activePlayMovie} onClose={() => { setActivePlayMovie(null); fetchBrowseData(); }} />
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        movie={upgradeMovieTarget}
        onSubscriptionSuccess={(updatedUser, movieToPlay) => {
          setUser(updatedUser);
          setShowUpgradeModal(false);
          if (movieToPlay) setActivePlayMovie(movieToPlay);
        }}
      />
    </div>
  );
}
