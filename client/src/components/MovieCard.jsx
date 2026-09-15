import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Check, ThumbsUp, ChevronDown, Mic, Star, Info } from 'lucide-react';

export default function MovieCard({ movie, onPlay, onOpenModal, isInWatchlist, onToggleWatchlist, isSubscribed }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const videoRef = useRef(null);

  const cachedUserStr = localStorage.getItem('netflix_user');
  const user = cachedUserStr ? JSON.parse(cachedUserStr) : null;
  const userIsSubscribed = isSubscribed !== undefined ? isSubscribed : (user?.subscriptionStatus === 'ACTIVE' || user?.role === 'ADMIN');

  const handleMouseEnter = () => {
    if (window.innerWidth <= 768) return; // Disable hover expansion on mobile touch
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
      setIsPlayingVideo(true);
    }, 500); // 500ms hover delay
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
    setIsPlayingVideo(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const isHls = movie.videoUrl && movie.videoUrl.endsWith('.m3u8');
  const matchPercentage = Math.floor(Math.random() * 15) + 85;

  const firstGenre = movie.genres ? movie.genres.split(',')[0].trim().toUpperCase() : 'ACTION';
  const releaseYear = movie.releaseYear || movie.year || 2026;

  return (
    <div
      className="movie-card-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if ('ontouchstart' in window || window.innerWidth <= 768) {
          onOpenModal(movie);
        }
      }}
    >
      {/* Poster Image Container */}
      <div className="card-poster-wrapper">
        <img src={movie.thumbnailUrl} alt={movie.title} className="card-poster-img" loading="lazy" />

        {/* Premium Star Badge when subscription is not active */}
        {!userIsSubscribed && !isHovered && (
          <div className="card-premium-badge">
            <Star size={10} fill="#ffc107" color="#ffc107" /> Premium
          </div>
        )}

        {/* Blue VJ Pill Badge (matching mobile screenshot) */}
        {movie.vj && !isHovered && (
          <div className="vj-pill-badge-red">
            {movie.vj}
          </div>
        )}

        {/* Circular Info Button (i) top right */}
        <button
          className="card-info-btn-topright"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal(movie);
          }}
          type="button"
          aria-label="Movie details"
        >
          <Info size={13} color="#ffffff" />
        </button>
      </div>

      {/* Title & Metadata Subtitle below poster */}
      <div className="card-details-below">
        <div className="card-mobile-title" title={movie.title}>{movie.title}</div>
        <div className="card-mobile-subtitle">
          {firstGenre} • {releaseYear}
        </div>
      </div>

      {/* Expanded Hover Card for Desktop */}
      {isHovered && (
        <div className="hover-card-expanded">
          <div className="hover-card-video-container" onClick={() => onPlay(movie)}>
            {isPlayingVideo && (
              isHls ? (
                <HlsCardPlayer src={movie.videoUrl} videoRef={videoRef} poster={movie.thumbnailUrl} />
              ) : (
                <video
                  ref={videoRef}
                  src={movie.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )
            )}
            {!isPlayingVideo && <img src={movie.thumbnailUrl} alt={movie.title} />}
          </div>

          <div className="hover-card-details">
            <div className="card-control-row">
              <div className="card-controls-left">
                <button className="card-control-btn play" onClick={() => onPlay(movie)}>
                  {userIsSubscribed ? <Play size={16} fill="#000" /> : <span style={{fontSize:'0.7rem',fontWeight:800}}>🔒</span>}
                </button>
                <button className="card-control-btn" onClick={() => onToggleWatchlist(movie)}>
                  {isInWatchlist ? <Check size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
                </button>
                <button className="card-control-btn" onClick={() => alert('Liked!')}>
                  <ThumbsUp size={16} color="#fff" />
                </button>
              </div>
              <button className="card-control-btn" onClick={() => onOpenModal(movie)}>
                <ChevronDown size={16} color="#fff" />
              </button>
            </div>

            <div className="card-metadata">
              <span className="card-match">{matchPercentage}% Match</span>
              <span className="card-rating-badge">{movie.rating}</span>
              <span style={{ color: '#fff' }}>{movie.duration}</span>
              {movie.vj && (
                <span className="vj-pill-badge-red" style={{ position: 'static' }}>
                  {movie.vj}
                </span>
              )}
            </div>

            <div className="card-genres">
              {movie.genres && movie.genres.split(',').map((genre, idx) => (
                <span key={idx} style={{ display: 'flex', gap: '6px' }}>
                  {idx > 0 && <span className="genre-dot">•</span>}
                  {genre.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inner helper component to initialize HLS stream in preview card thumbnail
function HlsCardPlayer({ src, videoRef, poster }) {
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
      muted
      loop
      playsInline
      poster={poster}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}
