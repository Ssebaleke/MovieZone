import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Plus, Check, ThumbsUp, ChevronLeft, Volume2, VolumeX, Mic } from 'lucide-react';
import { api } from '../utils/api';
import Navbar from '../components/Navbar';
import VideoPlayer from '../components/VideoPlayer';
import UpgradeModal from '../components/UpgradeModal';
import SignupModal from '../components/SignupModal';

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVJ, setActiveVJ] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [activePlayMovie, setActivePlayMovie] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const videoRef = useRef(null);

  const cachedUser = localStorage.getItem('netflix_user');
  const user = cachedUser ? JSON.parse(cachedUser) : null;
  const isLoggedIn = !!localStorage.getItem('netflix_token');
  const isSubscribed = user?.subscriptionStatus === 'ACTIVE' && (
    user?.role === 'ADMIN' || !user?.subscriptionEnd || new Date(user.subscriptionEnd) > new Date()
  );
  const currentProfile = isLoggedIn ? JSON.parse(localStorage.getItem('netflix_profile') || 'null') : null;
  const isInWatchlist = watchlist.some(m => m.id === movie?.id);

  useEffect(() => {
    if (isLoggedIn && currentProfile) {
      api.get(`/mylist/${currentProfile.id}`).then(list => { if (list) setWatchlist(list); }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setIsPlayingVideo(false);
    api.get(`/movies/${id}`)
      .then(data => {
        const m = data.movie || data;
        setMovie(m);
        setActiveVJ(m.vj || 'VJ Junior');
        setRecommendations(data.recommendations || []);
        const timer = setTimeout(() => setIsPlayingVideo(true), 1800);
        return () => clearTimeout(timer);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handlePlay = () => {
    if (!isLoggedIn) { setShowSignupModal(true); return; }
    if (!isSubscribed) { setShowUpgradeModal(true); return; }
    setActivePlayMovie({ ...movie, activeVJ });
  };

  const handleToggleWatchlist = async () => {
    if (!isLoggedIn) { setShowSignupModal(true); return; }
    if (!currentProfile) return;
    try {
      if (isInWatchlist) {
        await api.delete('/mylist', { profileId: currentProfile.id, movieId: movie.id });
        setWatchlist(prev => prev.filter(m => m.id !== movie.id));
      } else {
        const added = await api.post('/mylist', { profileId: currentProfile.id, movieId: movie.id });
        setWatchlist(prev => [added, ...prev]);
      }
    } catch {}
  };

  const handleRecClick = (rec) => {
    navigate(`/movie/${rec.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const availableVJs = [
    { name: movie?.vj || 'VJ Junior' },
    { name: 'VJ Emmy' },
    { name: 'VJ Ice P' },
  ];

  if (loading) {
    return (
      <div className="mdp-loading">
        <div className="mdp-loading-spinner" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="mdp-loading">
        <p style={{ color: '#aaa' }}>Movie not found.</p>
        <button className="mdp-back-btn" onClick={() => navigate('/browse')}>← Back to Browse</button>
      </div>
    );
  }

  const isHls = movie.videoUrl && movie.videoUrl.endsWith('.m3u8');
  const matchPct = Math.floor(Math.random() * 15) + 85;

  return (
    <div className="mdp-root">
      <Navbar />

      {/* Hero */}
      <div className="mdp-hero">
        {isPlayingVideo && movie.videoUrl ? (
          isHls
            ? <HlsPlayer src={movie.videoUrl} videoRef={videoRef} isMuted={isMuted} poster={movie.backdropUrl} />
            : <video ref={videoRef} src={movie.videoUrl} autoPlay muted={isMuted} loop playsInline className="mdp-hero-video" />
        ) : (
          <img src={movie.backdropUrl || movie.thumbnailUrl} alt={movie.title} className="mdp-hero-video" />
        )}
        <div className="mdp-hero-overlay" />

        {/* Back button */}
        <button className="mdp-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} /> Back
        </button>

        {/* Mute toggle */}
        {isPlayingVideo && (
          <button className="mdp-mute-btn" onClick={() => setIsMuted(m => !m)}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        )}

        {/* Hero info */}
        <div className="mdp-hero-info">
          <h1 className="mdp-title">{movie.title}</h1>
          <div className="mdp-meta">
            <span className="mdp-meta-match">{matchPct}% Match</span>
            <span className="mdp-meta-year">{movie.releaseYear || movie.year}</span>
            {movie.rating && <span className="mdp-meta-badge">{movie.rating}</span>}
            <span className="mdp-meta-type">{movie.type === 'SHOW' ? 'SERIES' : 'MOVIE'}</span>
            {movie.duration && <span className="mdp-meta-dur">{movie.duration}</span>}
          </div>

          <div className="mdp-actions">
            <button className="mdp-play-btn" onClick={handlePlay}>
              <Play size={18} fill="#000" color="#000" />
              {isSubscribed ? `Play · ${activeVJ}` : '🔒 Subscribe to Watch'}
            </button>
            <button className="mdp-icon-btn" onClick={handleToggleWatchlist}>
              {isInWatchlist ? <Check size={20} color="#46d369" /> : <Plus size={20} color="#fff" />}
            </button>
            <button className="mdp-icon-btn">
              <ThumbsUp size={20} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mdp-body">
        {/* Description */}
        <p className="mdp-desc">{movie.description}</p>

        {/* VJ Selector */}
        <div className="mdp-vj-section">
          <div className="mdp-section-label"><Mic size={13} color="#e50914" /> Audio Version</div>
          <div className="mdp-vj-pills">
            {availableVJs.map(vj => (
              <button
                key={vj.name}
                className={`mdp-vj-pill${activeVJ === vj.name ? ' active' : ''}`}
                onClick={() => setActiveVJ(vj.name)}
              >
                {vj.name}
              </button>
            ))}
          </div>
        </div>

        {/* Details row */}
        <div className="mdp-details-row">
          {movie.genres && <span><strong>Genres:</strong> {movie.genres}</span>}
          {movie.originCountry && <span><strong>Country:</strong> {movie.originCountry}</span>}
          <span><strong>Audio:</strong> Luganda Voiceover</span>
        </div>

        {/* More Like This */}
        {recommendations.length > 0 && (
          <div className="mdp-more">
            <h2 className="mdp-more-title">More Like This</h2>
            <div className="mdp-recs-grid">
              {recommendations.map(rec => (
                <div key={rec.id} className="mdp-rec-card" onClick={() => handleRecClick(rec)}>
                  <div className="mdp-rec-thumb">
                    <img src={rec.thumbnailUrl} alt={rec.title} />
                    <div className="mdp-rec-thumb-overlay" />
                    <button className="mdp-rec-play"><Play size={16} fill="#fff" color="#fff" /></button>
                  </div>
                  <div className="mdp-rec-info">
                    <div className="mdp-rec-meta">
                      {rec.rating && <span className="mdp-meta-badge">{rec.rating}</span>}
                      {rec.duration && <span className="mdp-rec-dur">{rec.duration}</span>}
                    </div>
                    <p className="mdp-rec-title">{rec.title}</p>
                    <p className="mdp-rec-desc">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {activePlayMovie && (
        <VideoPlayer movie={activePlayMovie} onClose={() => setActivePlayMovie(null)} />
      )}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        movie={movie}
        onSubscriptionSuccess={(updatedUser, movieToPlay) => {
          setShowUpgradeModal(false);
          if (movieToPlay) setActivePlayMovie(movieToPlay);
        }}
      />
      <SignupModal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} />
    </div>
  );
}

function HlsPlayer({ src, videoRef, isMuted, poster }) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls = null;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      import('hls.js').then(Hls => {
        if (Hls.default.isSupported()) {
          hls = new Hls.default();
          hls.loadSource(src);
          hls.attachMedia(video);
        }
      });
    }
    return () => { if (hls) hls.destroy(); };
  }, [src, videoRef]);

  return <video ref={videoRef} autoPlay muted={isMuted} loop playsInline poster={poster} className="mdp-hero-video" />;
}
