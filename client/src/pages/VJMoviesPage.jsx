import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Headphones, Play, Film } from 'lucide-react';
import { api } from '../utils/api';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import VideoPlayer from '../components/VideoPlayer';
import DetailModal from '../components/DetailModal';
import UpgradeModal from '../components/UpgradeModal';

const VJ_META = {
  'VJ Junior': { color: '#f59e0b', tagline: 'The Voice of Uganda', specialty: 'Action • Drama • Nollywood' },
  'VJ Emmy':   { color: '#8b5cf6', tagline: 'Smooth & Soulful',    specialty: 'Romance • K-Drama' },
  'VJ Ice P':  { color: '#06b6d4', tagline: 'Cool & Crisp',        specialty: 'Thriller • Sci-Fi' },
  'VJ Jingo':  { color: '#10b981', tagline: 'Energy & Vibes',      specialty: 'Comedy • Animation' },
  'VJ Mark':   { color: '#e50914', tagline: 'Deep & Dramatic',     specialty: 'Drama • Bollywood' },
  'VJ KIIWA':  { color: '#f97316', tagline: 'Bold & Fearless',     specialty: 'Horror • Western' },
};

function avatarUrl(name, color) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color.replace('#', '')}&color=fff&size=200&bold=true&font-size=0.4`;
}

export default function VJMoviesPage() {
  const { vjName } = useParams();
  const navigate = useNavigate();
  const decodedVJ = decodeURIComponent(vjName);
  const meta = VJ_META[decodedVJ] || { color: '#e50914', tagline: 'Ugandan VJ', specialty: 'Movies & Series' };

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

      {/* VJ Hero Banner */}
      <div className="vjm-hero" style={{ '--vj-color': meta.color }}>
        <div className="vjm-hero-bg" style={{ background: `linear-gradient(135deg, ${meta.color}22 0%, #0a0a0f 70%)` }} />
        <div className="vjm-hero-content">
          <button className="vjm-back-btn" onClick={() => navigate('/vjs')}>
            <ArrowLeft size={18} />
          </button>
          <div className="vjm-hero-avatar-wrap">
            <img src={avatarUrl(decodedVJ, meta.color)} alt={decodedVJ} className="vjm-hero-avatar" />
            <div className="vjm-hero-avatar-ring" style={{ borderColor: meta.color }} />
          </div>
          <div className="vjm-hero-info">
            <div className="vjm-hero-badge" style={{ background: meta.color, color: meta.color === '#f59e0b' ? '#000' : '#fff' }}>
              <Headphones size={11} /> VJ
            </div>
            <h1 className="vjm-hero-name">{decodedVJ}</h1>
            <p className="vjm-hero-tagline">{meta.tagline}</p>
            <p className="vjm-hero-specialty">{meta.specialty}</p>
            {!loading && (
              <div className="vjm-hero-count">
                <Film size={13} color={meta.color} />
                <span>{movies.length} titles available</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search + results */}
      <div className="vjm-body">
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

        {q && (
          <div className="vjm-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"</div>
        )}

        {loading ? (
          <div className="vjm-loading">
            <div className="vjm-loading-spinner" />
            Loading {decodedVJ} movies...
          </div>
        ) : filtered.length === 0 ? (
          <div className="vjm-empty">
            {q ? `No results for "${query}"` : `No movies found for ${decodedVJ} yet.`}
          </div>
        ) : (
          <div className="vjm-grid">
            {filtered.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onPlay={handlePlay}
                onOpenModal={setSelectedMovie}
                isInWatchlist={watchlist.some(m => m.id === movie.id)}
                onToggleWatchlist={handleToggleWatchlist}
                isSubscribed={isSubscribed}
              />
            ))}
          </div>
        )}
      </div>

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
