import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Check, ThumbsUp, X, Volume2, VolumeX, Mic, ChevronDown } from 'lucide-react';
import { api } from '../utils/api';

export default function DetailModal({ movie, onClose, onPlay, watchlist, onToggleWatchlist, isSubscribed }) {
  const [recommendations, setRecommendations] = useState([]);
  const [currentMovie, setCurrentMovie] = useState(movie);
  const [activeVJVersion, setActiveVJVersion] = useState(movie.vj || 'VJ Junior');
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const videoRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentMovie(movie);
    setActiveVJVersion(movie.vj || 'VJ Junior');
  }, [movie]);

  useEffect(() => {
    if (!currentMovie) return;
    const fetchMovieData = async () => {
      try {
        const data = await api.get(`/movies/${currentMovie.id}`);
        setRecommendations(data.recommendations || []);
        if (data.movie) setCurrentMovie(prev => ({ ...prev, ...data.movie }));
      } catch (err) {
        console.error('Error fetching details/recommendations:', err);
      }
    };
    fetchMovieData();
    setIsPlayingVideo(false);
    const timer = setTimeout(() => setIsPlayingVideo(true), 1500);
    return () => clearTimeout(timer);
  }, [currentMovie.id]);

  if (!currentMovie) return null;

  const isHls = currentMovie.videoUrl && currentMovie.videoUrl.endsWith('.m3u8');
  const isMovieInWatchlist = watchlist && watchlist.some(m => m.id === currentMovie.id);
  const matchPercentage = Math.floor(Math.random() * 15) + 85;
  const availableVJs = [
    { name: currentMovie.vj || 'VJ Junior' },
    { name: 'VJ Emmy' },
    { name: 'VJ Ice P' }
  ];

  const handleRecommendationClick = (recMovie) => {
    setCurrentMovie(recMovie);
    const scrollContainer = document.querySelector('.modal-overlay');
    if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── MOBILE BOTTOM SHEET ── */
  if (isMobile) {
    return (
      <div className="mobile-sheet-overlay" onClick={onClose}>
        <div className="mobile-sheet" onClick={e => e.stopPropagation()}>
          {/* Drag handle */}
          <div className="mobile-sheet-handle" />

          {/* Video / Backdrop preview */}
          <div className="mobile-sheet-preview">
            {isPlayingVideo ? (
              isHls ? (
                <HlsModalPlayer src={currentMovie.videoUrl} videoRef={videoRef} isMuted={isMuted} poster={currentMovie.backdropUrl} />
              ) : (
                <video ref={videoRef} src={currentMovie.videoUrl} autoPlay muted={isMuted} loop playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )
            ) : (
              <img src={currentMovie.backdropUrl || currentMovie.thumbnailUrl} alt={currentMovie.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <div className="mobile-sheet-preview-overlay" />

            {/* Close + Mute controls */}
            <button className="mobile-sheet-close" onClick={onClose}><X size={18} color="#fff" /></button>
            <button className="mobile-sheet-mute" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
            </button>
          </div>

          {/* Scrollable content */}
          <div className="mobile-sheet-body">
            {/* Title + meta */}
            <h2 className="mobile-sheet-title">{currentMovie.title}</h2>
            <div className="mobile-sheet-meta">
              <span className="meta-year-green">{currentMovie.releaseYear || currentMovie.year || 2026}</span>
              <span className="meta-type-badge">{currentMovie.type === 'SHOW' ? 'SERIES' : 'MOVIE'}</span>
              {currentMovie.rating && <span className="card-rating-badge">{currentMovie.rating}</span>}
              {currentMovie.duration && <span style={{ color: '#aaa' }}>{currentMovie.duration}</span>}
            </div>

            {/* BIG Play button */}
            {isSubscribed ? (
              <button className="mobile-sheet-play-btn" onClick={() => onPlay({ ...currentMovie, activeVJ: activeVJVersion })}>
                <Play size={20} fill="#000" color="#000" /> Play
              </button>
            ) : (
              <button className="mobile-sheet-play-btn dm-locked-btn" onClick={() => onPlay({ ...currentMovie, activeVJ: activeVJVersion })}>
                🔒 Subscribe to Watch
              </button>
            )}

            {/* Watchlist + Like row */}
            <div className="mobile-sheet-actions">
              <button className="mobile-sheet-action-btn" onClick={() => onToggleWatchlist(currentMovie)}>
                {isMovieInWatchlist ? <Check size={20} color="#46d369" /> : <Plus size={20} color="#fff" />}
                <span>{isMovieInWatchlist ? 'Saved' : 'My List'}</span>
              </button>
              <button className="mobile-sheet-action-btn" onClick={() => alert('Liked!')}>
                <ThumbsUp size={20} color="#fff" />
                <span>Like</span>
              </button>
            </div>

            {/* Description */}
            <p className="mobile-sheet-desc">{currentMovie.description}</p>

            {/* VJ selector */}
            <div className="mobile-sheet-vj-section">
              <div className="mobile-sheet-section-label"><Mic size={13} color="#e50914" /> Audio Version</div>
              <div className="mobile-sheet-vj-pills">
                {availableVJs.map(vj => (
                  <button
                    key={vj.name}
                    className={`mobile-sheet-vj-pill ${activeVJVersion === vj.name ? 'active' : ''}`}
                    onClick={() => setActiveVJVersion(vj.name)}
                  >
                    {vj.name}
                  </button>
                ))}
              </div>
            </div>

            {/* More Like This */}
            {recommendations.length > 0 && (
              <div className="mobile-sheet-more">
                <div className="mobile-sheet-section-label" style={{ marginBottom: '10px' }}>More Like This</div>
                <div className="mobile-sheet-recs">
                  {recommendations.slice(0, 6).map(rec => (
                    <div key={rec.id} className="mobile-sheet-rec-card" onClick={() => handleRecommendationClick(rec)}>
                      <img src={rec.thumbnailUrl} alt={rec.title} />
                      <span>{rec.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── DESKTOP LAYOUT ── */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Billboard Banner */}
        <div className="modal-video-billboard">
          {isPlayingVideo ? (
            isHls ? (
              <HlsModalPlayer src={currentMovie.videoUrl} videoRef={videoRef} isMuted={isMuted} poster={currentMovie.backdropUrl} />
            ) : (
              <video
                ref={videoRef}
                src={currentMovie.videoUrl}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )
          ) : (
            <img src={currentMovie.backdropUrl} alt={currentMovie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}

          <div className="modal-billboard-overlay"></div>
          
          <div className="modal-billboard-details">
            <h1 className="modal-billboard-title">{currentMovie.title}</h1>

            {/* VJ Version Selection pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mic size={14} color="#e50914" /> AUDIO VERSION:
              </span>
              {availableVJs.map(vj => (
                <button
                  key={vj.name}
                  onClick={() => setActiveVJVersion(vj.name)}
                  style={{
                    background: activeVJVersion === vj.name ? '#e50914' : 'rgba(0,0,0,0.6)',
                    border: `1px solid ${activeVJVersion === vj.name ? '#e50914' : 'rgba(255,255,255,0.3)'}`,
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {vj.name}
                </button>
              ))}
            </div>

            <div className="billboard-actions" style={{ flexWrap: 'wrap', gap: '10px' }}>
              {isSubscribed ? (
                <button className="billboard-btn billboard-play" onClick={() => onPlay({ ...currentMovie, activeVJ: activeVJVersion })}>
                  <Play size={20} fill="#000" /> Play ({activeVJVersion})
                </button>
              ) : (
                <button className="billboard-btn billboard-play dm-locked-btn" onClick={() => onPlay({ ...currentMovie, activeVJ: activeVJVersion })}>
                  🔒 Subscribe to Watch
                </button>
              )}
              <button className="card-control-btn" style={{ width: '44px', height: '44px' }} onClick={() => onToggleWatchlist(currentMovie)}>
                {isMovieInWatchlist ? <Check size={20} color="#fff" /> : <Plus size={20} color="#fff" />}
              </button>
              <button className="card-control-btn" style={{ width: '44px', height: '44px' }} onClick={() => alert('Liked!')}>
                <ThumbsUp size={20} color="#fff" />
              </button>
              {isPlayingVideo && (
                <button className="card-control-btn" style={{ width: '44px', height: '44px', marginLeft: '10px' }} onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Synopsis & Cast Grid */}
        <div className="modal-body-grid">
          <div>
            <div className="card-metadata" style={{ fontSize: '1rem', marginBottom: '16px' }}>
              <span className="card-match">{matchPercentage}% Match</span>
              <span style={{ color: '#fff' }}>{currentMovie.releaseYear}</span>
              <span className="card-rating-badge">{currentMovie.rating}</span>
              <span style={{ color: '#fff' }}>{currentMovie.duration}</span>
              <span style={{ background: '#e50914', color: '#fff', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>
                Voiced by {activeVJVersion}
              </span>
            </div>
            <p className="modal-synopsis">{currentMovie.description}</p>
          </div>

          <div className="modal-cast-info">
            <p><span>Translator / VJ:</span> <strong style={{ color: '#fff' }}>{activeVJVersion}</strong></p>
            <p><span>Genres:</span> {currentMovie.genres}</p>
            <p><span>Country / Region:</span> {currentMovie.originCountry || 'UG'} ({currentMovie.region || 'East African'})</p>
            <p><span>Audio Format:</span> Luganda Voiceover + Original Effects</p>
          </div>
        </div>

        {/* More Like This grid */}
        {recommendations.length > 0 && (
          <div className="more-like-this-section">
            <h3>More Like This</h3>
            <div className="recommendations-grid">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="recommendation-card"
                  onClick={() => handleRecommendationClick(rec)}
                >
                  <div className="recommendation-thumb" style={{ backgroundImage: `url(${rec.thumbnailUrl})` }} />
                  <div className="recommendation-details">
                    <div className="recommendation-meta-row">
                      <span className="card-rating-badge">{rec.rating}</span>
                      <span style={{ fontSize: '0.85rem' }}>{rec.duration}</span>
                    </div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>{rec.title}</h4>
                    <p className="recommendation-desc">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inner helper component to initialize HLS stream in preview card thumbnail
function HlsModalPlayer({ src, videoRef, isMuted, poster }) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls = null;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      import('hls.js').then((Hls) => {
        if (Hls.isSupported()) {
          hls = new Hls.default();
          hls.loadSource(src);
          hls.attachMedia(video);
        }
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, videoRef]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={isMuted}
      loop
      playsInline
      poster={poster}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}
