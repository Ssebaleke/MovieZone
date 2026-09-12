import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import MovieRow from '../components/MovieRow';
import DetailModal from '../components/DetailModal';
import VideoPlayer from '../components/VideoPlayer';
import MovieCard from '../components/MovieCard';
import { api } from '../utils/api';

export default function Browse() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);

  // Active navigation filter states
  const [activeTab, setActiveTab] = useState('home');
  const [activeVJ, setActiveVJ] = useState('');
  const [activeRegion, setActiveRegion] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Interaction Modals
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activePlayMovie, setActivePlayMovie] = useState(null);

  const navigate = useNavigate();
  const currentProfile = JSON.parse(localStorage.getItem('netflix_profile'));

  useEffect(() => {
    if (!localStorage.getItem('netflix_token')) {
      navigate('/login');
      return;
    }
    if (!currentProfile) {
      navigate('/profiles');
      return;
    }
    
    fetchBrowseData();
  }, [navigate, activeTab, activeVJ, activeRegion]);

  const fetchBrowseData = async () => {
    try {
      if (!currentProfile) return;

      let queryParams = [];
      if (activeVJ) queryParams.push(`vj=${encodeURIComponent(activeVJ)}`);
      if (activeRegion) queryParams.push(`region=${encodeURIComponent(activeRegion)}`);
      if (activeTab === 'series') queryParams.push('type=SHOW');
      if (activeTab === 'movies') queryParams.push('type=MOVIE');
      if (activeTab === 'latest') queryParams.push('latest=true');
      if (activeTab === 'trending') queryParams.push('trending=true');

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      // Fetch catalog grouped by rows
      const catalog = await api.get(`/movies${queryString}`);
      setCategories(catalog.categories || []);
      setFeatured(catalog.featured);

      // Fetch watchlist
      const list = await api.get(`/mylist/${currentProfile.id}`);
      setWatchlist(list);

      // Fetch watch progress history
      const history = await api.get(`/history/${currentProfile.id}`);
      setContinueWatching(history);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      if (err.status === 403 && err.data?.subscriptionRequired) {
        navigate('/signup/plans');
      }
    }
  };

  // Live search debounced trigger
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await api.get(`/movies/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(results);
      } catch (err) {
        console.error('Error executing search query:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Watchlist add/remove action
  const handleToggleWatchlist = async (movie) => {
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
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    }
  };

  const isMovieInWatchlist = (movieId) => {
    return watchlist.some(m => m.id === movieId);
  };

  // Dynamic filter header text
  const getFilterHeader = () => {
    if (activeVJ) return `Showing titles translated by ${activeVJ}`;
    if (activeRegion) return `Showing ${activeRegion.toUpperCase()} titles`;
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

      {searchQuery ? (
        // Search Results layout grid
        <div style={{ padding: '120px 4% 60px 4%' }}>
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
                  onPlay={setActivePlayMovie}
                  onOpenModal={setSelectedMovie}
                  isInWatchlist={isMovieInWatchlist(movie.id)}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              ))}
            </div>
          ) : (
            <div style={{ color: '#aaa', padding: '40px 0' }}>No matching movies or shows found for your search query.</div>
          )}
        </div>
      ) : (
        // Main Dashboard Browse Layout
        <>
          {featured && (
            <HeroBanner
              movie={featured}
              onPlay={setActivePlayMovie}
              onOpenModal={setSelectedMovie}
            />
          )}

          <div style={{ paddingBottom: '60px', position: 'relative', zIndex: '5', background: '#141414' }}>
            
            {/* Filter status banner */}
            {getFilterHeader() && (
              <div style={{ padding: '20px 4% 0 4%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', borderLeft: '4px solid #e50914', paddingLeft: '12px' }}>
                  {getFilterHeader()}
                </h2>
                <button
                  style={{ background: '#333', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                  onClick={() => { setActiveTab('home'); setActiveVJ(''); setActiveRegion(''); }}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Continue Watching row */}
            {continueWatching.length > 0 && !activeVJ && !activeRegion && (
              <MovieRow
                title="Continue Watching"
                movies={continueWatching.map(item => item.movie)}
                onPlay={setActivePlayMovie}
                onOpenModal={setSelectedMovie}
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            )}

            {/* My List row */}
            {watchlist.length > 0 && !activeVJ && !activeRegion && (
              <MovieRow
                title="My List"
                movies={watchlist}
                onPlay={setActivePlayMovie}
                onOpenModal={setSelectedMovie}
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            )}

            {/* General row sliders */}
            {categories.map((cat, idx) => (
              <MovieRow
                key={idx}
                title={cat.name}
                movies={cat.items}
                onPlay={setActivePlayMovie}
                onOpenModal={setSelectedMovie}
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            ))}
          </div>
        </>
      )}

      {/* Pop-up modal details */}
      {selectedMovie && (
        <DetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={setActivePlayMovie}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}

      {/* Immersive full-screen media player */}
      {activePlayMovie && (
        <VideoPlayer
          movie={activePlayMovie}
          onClose={() => {
            setActivePlayMovie(null);
            fetchBrowseData();
          }}
        />
      )}
    </div>
  );
}
