import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Check, ThumbsUp, ChevronDown, Mic } from 'lucide-react';

export default function MovieCard({ movie, onPlay, onOpenModal, isInWatchlist, onToggleWatchlist }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const videoRef = useRef(null);

  const handleMouseEnter = () => {
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

  return (
    <div
      className="movie-card-item"
      style={{ backgroundImage: `url(${movie.thumbnailUrl})` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if ('ontouchstart' in window || window.innerWidth <= 768) {
          onOpenModal(movie);
        }
      }}
    >
      {/* VJ Badge overlay on static thumbnail */}
      {movie.vj && !isHovered && (
        <div className="vj-pill-badge">
          <Mic size={10} color="#fff" /> {movie.vj}
        </div>
      )}

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
                  <Play size={16} fill="#000" />
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
                <span style={{ background: '#e50914', color: '#fff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
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
