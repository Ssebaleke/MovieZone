import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Plus, Check, Search, X, Headphones } from 'lucide-react';
import { api } from '../utils/api';
import Navbar from '../components/Navbar';
import VideoPlayer from '../components/VideoPlayer';
import DetailModal from '../components/DetailModal';
import UpgradeModal from '../components/UpgradeModal';

export default function VJMoviesPage() {
  const { vjName } = useParams();
  const navigate = useNavigate();
  const decodedVJ = decodeURIComponent(vjName);

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [watchlist, setWatchlist] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activePlayMovie, setActivePlayMovie] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState(null);
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('netflix_user');
    return s ? JSON.parse(s) : null;
  });

  const isSubscribed = user?.subscriptionStatus === 'ACTIVE' &&
    (user?.role === 'ADMIN' || !user?.subscriptionEnd || new Date(user.subscriptionEnd) > new Date());

  const profile = JSON.parse(localStorage.getItem('netflix_profile') || 'null');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/movies?vj=${encodeURIComponent(decodedVJ)}`),
      profile ? api.get(`/mylist/${profile.id}`) : Promise.resolve([]),
    ])
      .then(([catalog, list]) => {
        // flatten all categories into one list, deduplicated by id
        const all = [];
        const seen = new Set();
        (catalog.categories || []).forEach(cat => {
          (cat.movies || cat.items || []).forEach(m => {
            if (!seen.has(m.id)) { seen.add(m.id); all.push(m); }
          });
        });
        setMovies(all);
        setWatchlist(Array.isArray(list) ? list : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [decodedVJ]);

  const handlePlay = (movie) => {
    if (!isSubscribed) { setUpgradeTarget(movie); setShowUpgradeModal(true); }
    else setActivePlayMovie(movie);
  };

  const handleToggleWatchlist = async (movie) => {
    if (!profile) return;
    const inList = watchlist.some(m => m.id === movie.id);
    try {
      if (inList) {
        await api.delete('/mylist', { profileId: profile.id, movieId: movie.id });
        setWatchlist(prev => prev.filter(m => m.id !== movie.id));
      } else {
        const added = await api.post('/mylist', { profileId: profile.id, movieId: movie.id });
        setWatchlist(prev => [added, ...prev]);
      }
    } catch {}
  };

  const q = query.trim().toLowerCase();
  const filtered = q ? movies.filter(m => m.title?.toLowerCase().includes(q)) : movies;

  return (
    <div className="vjm-page">
      <Navbar
        searchQuery=""
        onSearchChange={() => {}}
        activeTab=""
        setActiveTab={() => {}}
        activeVJ=""
        setActiveVJ={() => {}}
        activeRegion=""
        setActiveRegion={() => {}}
      />
      {/* Header */}
      <div className="vjm-header">
        <button className="vjm-back-btn" onClick={() => navigate('/vjs')}>
          <ArrowLeft size={20} />
        </button>
        <div className="vjm-title-wrap">
          <Headphones size={18} color="#e50914" />
          <h1>{decodedVJ}</h1>
        </div>
        <div style={{ width: 38 }} />
      </div>

      {/* Search */}
      <div className="vjm-search-wrap">
        <Search size={15} color="#666" />
        <input
          className="vjm-search-input"
          placeholder={`Search ${decodedVJ} movies...`}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && <button className="vjm-search-clear" onClick={() => setQuery('')}><X size={13} /></button>}
      </div>

      {/* Count */}
      {!loading && (
        <div className="vjm-count">
          {filtered.length} title{filtered.length !== 1 ? 's' : ''}{q ? ` matching "${query}"` : ` by ${decodedVJ}`}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="vjm-loading">Loading {decodedVJ} movies...</div>
      ) : filtered.length === 0 ? (
        <div className="vjm-empty">{q ? `No results for "${query}"` : `No movies found for ${decodedVJ} yet.`}</div>
      ) : (
        <div className="vjm-grid">
          {filtered.map(movie => {
            const inList = watchlist.some(m => m.id === movie.id);
            return (
              <div key={movie.id} className="vjm-card" onClick={() => setSelectedMovie(movie)}>
                <div className="vjm-card-poster">
                  <img
                    src={movie.posterUrl || movie.poster}
                    alt={movie.title}
                    loading="lazy"
                    onError={e => { e.currentTarget.style.background = '#1a1a22'; e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="vjm-card-overlay">
                    <button className="vjm-play-btn" onClick={e => { e.stopPropagation(); handlePlay(movie); }}>
                      <Play size={16} fill="#fff" />
                    </button>
                    <button className="vjm-list-btn" onClick={e => { e.stopPropagation(); handleToggleWatchlist(movie); }}>
                      {inList ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                </div>
                <div className="vjm-card-title">{movie.title}</div>
                {movie.year && <div className="vjm-card-year">{movie.year}</div>}
              </div>
            );
          })}
        </div>
      )}

      {selectedMovie && (
        <DetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={handlePlay}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
          isSubscribed={isSubscribed}
        />
      )}

      {activePlayMovie && (
        <VideoPlayer movie={activePlayMovie} onClose={() => setActivePlayMovie(null)} />
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        movie={upgradeTarget}
        onSubscriptionSuccess={(updatedUser, movieToPlay) => {
          setUser(updatedUser);
          setShowUpgradeModal(false);
          if (movieToPlay) setActivePlayMovie(movieToPlay);
        }}
      />
    </div>
  );
}
