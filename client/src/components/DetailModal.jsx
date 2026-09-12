import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Check, ThumbsUp, X, Volume2, VolumeX, Mic } from 'lucide-react';
import { api } from '../utils/api';

export default function DetailModal({ movie, onClose, onPlay, watchlist, onToggleWatchlist }) {
  const [recommendations, setRecommendations] = useState([]);
  const [currentMovie, setCurrentMovie] = useState(movie);
  const [activeVJVersion, setActiveVJVersion] = useState(movie.vj || 'VJ Junior');
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    setCurrentMovie(movie);
    setActiveVJVersion(movie.vj || 'VJ Junior');
  }, [movie]);

  useEffect(() => {
    if (!currentMovie) return;
    
    // Fetch detailed data + recommendations
    const fetchMovieData = async () => {
      try {
        const data = await api.get(`/movies/${currentMovie.id}`);
        setRecommendations(data.recommendations || []);
        if (data.movie) {
          setCurrentMovie(prev => ({ ...prev, ...data.movie }));
        }
      } catch (err) {
        console.error('Error fetching details/recommendations:', err);
      }
    };

    fetchMovieData();
    setIsPlayingVideo(false);

    // Auto-play trailer inside modal after 1.5 seconds
    const timer = setTimeout(() => {
      setIsPlayingVideo(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentMovie.id]);

  if (!currentMovie) return null;

  const isHls = currentMovie.videoUrl && currentMovie.videoUrl.endsWith('.m3u8');
  const isMovieInWatchlist = watchlist && watchlist.some(m => m.id === currentMovie.id);
  const matchPercentage = Math.floor(Math.random() * 15) + 85;

  const availableVJs = [
    { name: currentMovie.vj || 'VJ Junior', desc: 'Action & High Energy Luganda' },
    { name: 'VJ Emmy', desc: 'Romance & Deep Voiceover' },
    { name: 'VJ Ice P', desc: 'Fast Commentary & FX' }
  ];

  const handleRecommendationClick = (recMovie) => {
    setCurrentMovie(recMovie);
    const scrollContainer = document.querySelector('.modal-overlay');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
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

            <div className="billboard-actions">
              <button className="billboard-btn billboard-play" onClick={() => onPlay({ ...currentMovie, activeVJ: activeVJVersion })}>
                <Play size={20} fill="#000" /> Play ({activeVJVersion})
              </button>
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
